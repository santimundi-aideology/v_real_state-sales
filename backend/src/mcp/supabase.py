"""
MCP tools for interacting with Supabase MCP server.
Simplified version that only uses list_tables and execute_sql tools.
"""

import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from langchain_core.tools import BaseTool
from supabase import create_client, Client

from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_mcp_adapters.tools import load_mcp_tools

# Get the directory where this module is located
_MODULE_DIR = Path(__file__).parent

logger = logging.getLogger(__name__)

# Optional: reduce noisy logs. Keep at WARNING so real issues still show up.
logging.getLogger("mcp").setLevel(logging.WARNING)
logging.getLogger("langchain_mcp_adapters").setLevel(logging.WARNING)


# -----------------------------
# Module-level cached state
# -----------------------------
_client: Optional[MultiServerMCPClient] = None

# Async context managers for each server
_supabase_session_cm: Any = None
_periskope_session_cm: Any = None

# The live, active MCP session objects (created by __aenter__()).
_supabase_session: Any = None
_periskope_session: Any = None

# Tools loaded from the sessions (cached).
_supabase_tools: Optional[List[BaseTool]] = None
_periskope_tools: Optional[List[BaseTool]] = None

# Supabase admin client (singleton).
_supabase_admin: Optional[Client] = None

# Lock to protect init/shutdown in concurrent environments (FastAPI, async servers).
_init_lock = asyncio.Lock()


def load_mcp_servers(config_path: str | None = None) -> Dict[str, Any]:
    """
    Load MCP server definitions from a JSON config file.
    Expects a top-level 'mcpServers' dict in the config.

    Also injects Authorization header for supabase server entries:
    - Prefer SUPABASE_ACCESS_TOKEN (PAT)
    - Fall back to existing config Authorization header (if present)
    - Finally fall back to SUPABASE_ANON_KEY (last resort; usually not enough for hosted MCP)
    """
    # Default to mcp.json in the same directory as this module
    if config_path is None:
        config_path = str(_MODULE_DIR / "mcp.json")
    
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
                    # Best: your Supabase PAT / access token
                    server["headers"]["Authorization"] = f"Bearer {supabase_pat}"
                else:
                    # If user already put Authorization in mcp.json, normalize it.
                    existing = server["headers"].get("Authorization", "")
                    if existing and not existing.startswith("Bearer "):
                        server["headers"]["Authorization"] = f"Bearer {existing}"
                    elif not existing and supabase_anon:
                        # Last resort—often insufficient for hosted MCP
                        server["headers"]["Authorization"] = f"Bearer {supabase_anon}"

    return servers


async def init_mcp() -> None:
    """
    Initialize MCP once per process:
    - Create MultiServerMCPClient
    - Open persistent sessions to supabase and periskope-mcp servers
    - Load tools from both sessions

    This is the key change vs calling client.get_tools(), which typically results in
    a fresh session per tool call.
    """
    global _client, _supabase_session_cm, _supabase_session, _supabase_tools
    global _periskope_session_cm, _periskope_session, _periskope_tools

    async with _init_lock:
        # Already initialized -> nothing to do
        if _supabase_tools is not None and _periskope_tools is not None:
            return

        mcp_servers = load_mcp_servers()
        _client = MultiServerMCPClient(mcp_servers)

        # Initialize Supabase session
        if _supabase_tools is None:
            _supabase_session_cm = _client.session("supabase")
            _supabase_session = await _supabase_session_cm.__aenter__()
            _supabase_tools = await load_mcp_tools(_supabase_session)
            logger.info("MCP initialized with persistent session (server=supabase)")
            logger.info(f"Loaded {len(_supabase_tools)} Supabase MCP tools")

        # Initialize Periskope session
        if _periskope_tools is None and "periskope-mcp" in mcp_servers:
            try:
                _periskope_session_cm = _client.session("periskope-mcp")
                _periskope_session = await _periskope_session_cm.__aenter__()
                all_periskope_tools = await load_mcp_tools(_periskope_session)
                
                # Filter to only include the specified WhatsApp tools
                allowed_periskope_tools = [
                    "periskope_send_message",
                    "periskope_list_chats",
                    "periskope_get_chat",
                    "periskope_list_messages_in_a_chat",
                    "periskope_get_message_by_id",
                    "periskope_list_contacts",
                    "periskope_get_contact_by_id"
                ]
                
                _periskope_tools = [
                    tool for tool in all_periskope_tools 
                    if tool.name in allowed_periskope_tools
                ]
                
                logger.info("MCP initialized with persistent session (server=periskope-mcp)")
                logger.info(f"Loaded {len(_periskope_tools)} Periskope MCP tools (filtered from {len(all_periskope_tools)})")
                logger.info(f"Periskope tools: {[tool.name for tool in _periskope_tools]}")
            except Exception as e:
                logger.warning(f"Failed to initialize periskope-mcp server: {e}")
                logger.warning("Continuing without periskope tools")
                _periskope_tools = []


async def shutdown_mcp() -> None:
    """
    Close the persistent MCP sessions and clear caches.
    Call once at application shutdown.
    """
    global _client, _supabase_session_cm, _supabase_session, _supabase_tools
    global _periskope_session_cm, _periskope_session, _periskope_tools

    async with _init_lock:
        # Close Supabase session
        if _supabase_session_cm is not None:
            try:
                await _supabase_session_cm.__aexit__(None, None, None)
            except (RuntimeError, GeneratorExit, Exception, asyncio.CancelledError) as e:
                logger.debug(f"Supabase MCP session cleanup warning (non-critical): {type(e).__name__}: {e}")
            finally:
                _supabase_session_cm = None
                _supabase_session = None

        # Close Periskope session
        if _periskope_session_cm is not None:
            try:
                await _periskope_session_cm.__aexit__(None, None, None)
            except (RuntimeError, GeneratorExit, Exception, asyncio.CancelledError) as e:
                logger.debug(f"Periskope MCP session cleanup warning (non-critical): {type(e).__name__}: {e}")
            finally:
                _periskope_session_cm = None
                _periskope_session = None

        # Drop cached tools/client references
        _supabase_tools = None
        _periskope_tools = None
        _client = None

        logger.info("MCP shutdown complete")


async def get_mcp_tools() -> List[BaseTool]:
    """
    Get cached tools from both Supabase and Periskope servers; lazily initializes MCP if needed.
    
    Returns:
        - Supabase tools: 'execute_sql' and 'list_tables' (filtered and sorted)
        - Periskope tools: 'periskope_send_message', 'periskope_list_chats', 'periskope_get_chat',
          'periskope_list_messages_in_a_chat', 'periskope_get_message_by_id', 'periskope_list_contacts',
          'periskope_get_contact_by_id' (filtered)
    """
    if _supabase_tools is None or _periskope_tools is None:
        await init_mcp()
    
    # Filter Supabase tools to only include 'execute_sql' and 'list_tables'
    # Sort by name to ensure consistent ordering: 'execute_sql' will be index 0, 'list_tables' will be index 1
    filtered_supabase_tools = sorted(
        [tool for tool in (_supabase_tools or []) if tool.name in ['execute_sql', 'list_tables']],
        key=lambda t: t.name
    )
    
    # Periskope tools are already filtered during initialization
    periskope_tools = _periskope_tools or []
    
    # Combine tools: Supabase first, then Periskope
    all_tools = filtered_supabase_tools + periskope_tools
    
    logger.info(f"Returning {len(all_tools)} MCP tools:")
    logger.info(f"  - Supabase: {[tool.name for tool in filtered_supabase_tools]}")
    logger.info(f"  - Periskope: {[tool.name for tool in periskope_tools]}")
    
    return all_tools


def get_mcp_tools_sync() -> List[BaseTool]:
    """
    Synchronous version of get_mcp_tools().
    Gets cached tools; lazily initializes MCP if needed.
    Use this in synchronous contexts.
    
    Note: This will block the current thread while initializing MCP if needed.
    Raises RuntimeError if called from within an async context (use await get_mcp_tools() instead).
    """
    # Check if tools are already cached
    if _supabase_tools is not None and _periskope_tools is not None:
        # Filter and combine tools (same logic as async version)
        filtered_supabase_tools = sorted(
            [tool for tool in _supabase_tools if tool.name in ['execute_sql', 'list_tables']],
            key=lambda t: t.name
        )
        periskope_tools = _periskope_tools or []
        all_tools = filtered_supabase_tools + periskope_tools
        
        logger.info(f"Returning {len(all_tools)} cached MCP tools (sync):")
        logger.info(f"  - Supabase: {[tool.name for tool in filtered_supabase_tools]}")
        logger.info(f"  - Periskope: {[tool.name for tool in periskope_tools]}")
        
        return all_tools
    
    # Tools aren't cached, we need to initialize MCP
    # Check if we're in an async context first
    try:
        loop = asyncio.get_running_loop()
        # If we get here, we're in an async context
        raise RuntimeError(
            "Cannot use get_mcp_tools_sync() in an async context. "
            "Use await get_mcp_tools() instead."
        )
    except RuntimeError as e:
        # If it's our error, re-raise it
        if "Cannot use get_mcp_tools_sync" in str(e):
            raise
        # Otherwise, no event loop is running, so we can use asyncio.run()
        pass
    
    # Initialize MCP synchronously
    logger.info("Initializing MCP synchronously (blocking)...")
    asyncio.run(init_mcp())
    
    # Now that MCP is initialized, get and return the tools
    filtered_supabase_tools = sorted(
        [tool for tool in (_supabase_tools or []) if tool.name in ['execute_sql', 'list_tables']],
        key=lambda t: t.name
    )
    periskope_tools = _periskope_tools or []
    all_tools = filtered_supabase_tools + periskope_tools
    
    logger.info(f"Returning {len(all_tools)} MCP tools (sync):")
    logger.info(f"  - Supabase: {[tool.name for tool in filtered_supabase_tools]}")
    logger.info(f"  - Periskope: {[tool.name for tool in periskope_tools]}")
    
    return all_tools


def get_periskope_tool(tool_name: str) -> Optional[BaseTool]:
    """
    Get a specific Periskope MCP tool by name.
    
    Args:
        tool_name: Name of the tool to retrieve (e.g., 'periskope_send_message')
    
    Returns:
        The tool if found, None otherwise
    """
    global _periskope_tools
    
    if _periskope_tools is None:
        # Tools not initialized yet - this shouldn't happen in normal flow
        # but we'll handle it gracefully
        logger.warning("Periskope tools not initialized. Call get_mcp_tools() first.")
        return None
    
    for tool in _periskope_tools:
        if tool.name == tool_name:
            return tool
    
    logger.warning(f"Periskope tool '{tool_name}' not found in available tools")
    return None


def get_supabase_client() -> Client:
    """
    Get or create Supabase admin client instance (singleton pattern).
    
    Returns:
        Supabase client instance
        
    Raises:
        ValueError: If Supabase credentials are not found
    """
    global _supabase_admin
    if _supabase_admin is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_service_role_key:
            raise ValueError(
                "Supabase credentials not found. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
            )
        _supabase_admin = create_client(supabase_url, supabase_service_role_key)
    return _supabase_admin
