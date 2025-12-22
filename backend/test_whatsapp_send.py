"""
Test script for sending WhatsApp messages via periskope-mcp server.
This mirrors the exact initialization pattern used in supabase.py
to ensure compatibility with the live system.
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from langchain_core.tools import BaseTool
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_mcp_adapters.tools import load_mcp_tools

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('whatsapp_test.log')
    ]
)
logger = logging.getLogger(__name__)

# Reduce noise from MCP libraries
logging.getLogger("mcp").setLevel(logging.WARNING)
logging.getLogger("langchain_mcp_adapters").setLevel(logging.WARNING)

# Get the directory where this module is located
_MODULE_DIR = Path(__file__).parent


def load_mcp_servers(config_path: str | None = None) -> Dict[str, Any]:
    """
    Load MCP server definitions from a JSON config file.
    Mirrors the exact function from supabase.py
    """
    # Default to mcp.json in the same directory as supabase.py
    if config_path is None:
        config_path = str(_MODULE_DIR / "src" / "mcp" / "mcp.json")
    
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"MCP config file not found: {config_path}")

    with open(config_path, "r") as f:
        config = json.load(f)

    servers = config.get("mcpServers", {})

    supabase_anon = os.getenv("SUPABASE_ANON_KEY")
    supabase_pat = os.getenv("SUPABASE_ACCESS_TOKEN")

    for name, server in servers.items():
        # If server uses a local command, default to stdio transport.
        if "command" in server and "transport" not in server:
            server["transport"] = "stdio"

        # If server uses a URL, default to streamable_http transport.
        if "url" in server and "transport" not in server:
            server["transport"] = "streamable_http"

        # Add headers if this is an HTTP-based MCP server.
        if "url" in server:
            server.setdefault("headers", {})

            # Only inject auth for supabase entries
            if "supabase" in name.lower():
                if supabase_pat:
                    server["headers"]["Authorization"] = f"Bearer {supabase_pat}"
                else:
                    existing = server["headers"].get("Authorization", "")
                    if existing and not existing.startswith("Bearer "):
                        server["headers"]["Authorization"] = f"Bearer {existing}"
                    elif not existing and supabase_anon:
                        server["headers"]["Authorization"] = f"Bearer {supabase_anon}"

    return servers


def tool_by_name(tools: List[BaseTool], name: str) -> Optional[BaseTool]:
    """Find a tool by name."""
    for tool in tools:
        if tool.name == name:
            return tool
    return None


async def init_mcp_servers() -> tuple[MultiServerMCPClient, Any, Any, List[BaseTool], List[BaseTool]]:
    """
    Initialize both Supabase and Periskope MCP servers.
    Mirrors the exact initialization pattern from supabase.py
    """
    logger.info("=" * 80)
    logger.info("Initializing MCP Servers (Supabase + Periskope)")
    logger.info("=" * 80)
    
    mcp_servers = load_mcp_servers()
    client = MultiServerMCPClient(mcp_servers)

    # Initialize Supabase session
    logger.info("Initializing Supabase session...")
    supabase_session_cm = client.session("supabase")
    supabase_session = await supabase_session_cm.__aenter__()
    supabase_tools = await load_mcp_tools(supabase_session)
    logger.info(f"Loaded {len(supabase_tools)} Supabase MCP tools")

    # Initialize Periskope session
    periskope_session = None
    periskope_session_cm = None
    periskope_tools = []
    
    if "periskope-mcp" in mcp_servers:
        try:
            logger.info("Initializing Periskope session...")
            periskope_session_cm = client.session("periskope-mcp")
            periskope_session = await periskope_session_cm.__aenter__()
            all_periskope_tools = await load_mcp_tools(periskope_session)
            
            # Filter to only include the specified WhatsApp tools (same as supabase.py)
            allowed_periskope_tools = [
                "periskope_send_message",
                "periskope_list_chats",
                "periskope_get_chat",
                "periskope_list_messages_in_a_chat",
                "periskope_get_message_by_id",
                "periskope_list_contacts",
                "periskope_get_contact_by_id"
            ]
            
            periskope_tools = [
                tool for tool in all_periskope_tools 
                if tool.name in allowed_periskope_tools
            ]
            
            logger.info(f"Loaded {len(periskope_tools)} Periskope MCP tools (filtered from {len(all_periskope_tools)})")
            logger.info(f"Periskope tools: {[tool.name for tool in periskope_tools]}")
        except Exception as e:
            logger.warning(f"Failed to initialize periskope-mcp server: {e}")
            logger.warning("Continuing without periskope tools")
            periskope_tools = []
    else:
        logger.warning("Periskope-mcp server not found in config")

    return client, supabase_session_cm, periskope_session_cm, supabase_tools, periskope_tools


async def shutdown_mcp_servers(
    client: MultiServerMCPClient,
    supabase_session_cm: Any,
    periskope_session_cm: Any
) -> None:
    """
    Close MCP sessions and cleanup.
    Mirrors the shutdown pattern from supabase.py
    Handles cleanup errors gracefully (common with stdio-based MCP servers on Windows).
    """
    logger.info("Shutting down MCP sessions...")
    
    # Close Supabase session
    if supabase_session_cm is not None:
        try:
            await supabase_session_cm.__aexit__(None, None, None)
        except (RuntimeError, GeneratorExit, Exception, asyncio.CancelledError) as e:
            logger.debug(f"Supabase MCP session cleanup warning (non-critical): {type(e).__name__}: {e}")
    
    # Close Periskope session
    # Note: stdio-based MCP servers often have cleanup issues on Windows - these are non-critical
    if periskope_session_cm is not None:
        try:
            await periskope_session_cm.__aexit__(None, None, None)
        except (RuntimeError, GeneratorExit, Exception, asyncio.CancelledError) as e:
            # These cleanup errors are common with stdio-based servers and don't affect functionality
            logger.debug(f"Periskope MCP session cleanup warning (non-critical): {type(e).__name__}: {e}")
    
    logger.info("MCP shutdown complete")


async def test_send_whatsapp_message(periskope_tools: List[BaseTool], phone_number: str, message: str):
    """
    Test sending a WhatsApp message using the periskope_send_message tool.
    """
    logger.info("=" * 80)
    logger.info("Testing WhatsApp Message Send")
    logger.info("=" * 80)
    
    # Find the periskope_send_message tool
    send_tool = tool_by_name(periskope_tools, "periskope_send_message")
    
    if not send_tool:
        raise ValueError("periskope_send_message tool not found in periskope_tools")
    
    logger.info(f"Found tool: {send_tool.name}")
    logger.info(f"Tool description: {send_tool.description[:100]}...")
    
    # Check tool schema to determine correct parameters
    logger.info(f"Tool schema: {send_tool.args_schema}")
    
    # Format phone number according to Periskope format: 919826000000@c.us
    # The phone number should be in format: country_code + number + @c.us
    # If phone_number doesn't already have @c.us, add it
    if "@c.us" not in phone_number:
        formatted_phone = f"{phone_number}@c.us"
    else:
        formatted_phone = phone_number
    
    # Prepare the message payload based on periskope_send_message tool schema
    # Schema shows: {'phone': '...', 'message': '...'}
    payload = {
        "phone": formatted_phone,  # Must be 'phone' not 'phone_number', format: 919826000000@c.us
        "message": message,
    }
    
    logger.info(f"Sending message to: {phone_number}")
    logger.info(f"Message: {message}")
    logger.info(f"Payload: {payload}")
    
    try:
        # Invoke the tool
        result = await send_tool.ainvoke(payload)
        
        logger.info("=" * 80)
        logger.info("Message send result:")
        logger.info("=" * 80)
        logger.info(result)
        logger.info("=" * 80)
        
        return result
        
    except Exception as e:
        logger.error(f"Error sending WhatsApp message: {e}", exc_info=True)
        raise


async def main():
    """Main test function."""
    client = None
    supabase_session_cm = None
    periskope_session_cm = None
    
    try:
        # Initialize MCP servers (same pattern as supabase.py)
        client, supabase_session_cm, periskope_session_cm, supabase_tools, periskope_tools = await init_mcp_servers()
        
        # Check if we have WhatsApp tools
        if not periskope_tools:
            logger.error("No Periskope tools available. Cannot test WhatsApp sending.")
            return 1
        
        # Get phone number and message from environment or use defaults
        phone_number = os.getenv("TEST_PHONE_NUMBER", "19786908266")  # Same number as before
        test_message = os.getenv("TEST_MESSAGE", "Hello from MCP! This is a test message.")  # Same message
        
        logger.info(f"\nUsing phone number: {phone_number}")
        logger.info(f"Using message: {test_message}\n")
        
        # Test sending WhatsApp message
        result = await test_send_whatsapp_message(periskope_tools, phone_number, test_message)
        
        logger.info("\nTest completed successfully!")
        return 0
        
    except Exception as e:
        logger.error(f"Test failed: {e}", exc_info=True)
        return 1
        
    finally:
        # Cleanup (same pattern as supabase.py)
        if client:
            await shutdown_mcp_servers(client, supabase_session_cm, periskope_session_cm)


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        logger.info("\nTest interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"\nFatal error: {e}", exc_info=True)
        sys.exit(1)

