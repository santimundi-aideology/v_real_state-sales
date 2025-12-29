"""
Logging utility functions for agent nodes.

This module provides helper functions for consistent logging across all nodes,
including node entry/exit logging, tool call logging, and debug information.
"""

import logging
from typing import List, Any, Optional
from langchain_core.messages import ToolMessage, AIMessage, BaseMessage

logger = logging.getLogger(__name__)


def log_node_entry(node_name: str):
    """
    Log entry into a graph node with a clear visual separator.
    
    This creates a visual boundary in logs to easily identify when a new node starts executing.
    Used at the beginning of each LangGraph node to track workflow progression.
    
    Args:
        node_name: Name of the node being entered
    """
    # Create visual separator for easy log scanning
    logger.info("=" * 80)
    logger.info(f">>> NODE: {node_name}")
    logger.info("=" * 80)


def log_tool_calls(response: AIMessage, context: str = ""):
    """
    Log tool calls from an LLM response.
    
    When the LLM decides to use tools (e.g., execute_sql, send_email), this function
    logs which tools were called and with what arguments. This is critical for debugging
    agent behavior and understanding the decision-making process.
    
    Args:
        response: The LLM response (AIMessage) that may contain tool calls
        context: Optional context string to include in log messages (e.g., node name)
    """
    # Check if the response contains tool calls (LLM decided to use tools)
    if hasattr(response, 'tool_calls') and response.tool_calls:
        context_str = f" ({context})" if context else ""
        logger.info(f"LLM made {len(response.tool_calls)} tool call(s){context_str}:")
        # Log each tool call with its name and arguments for debugging
        for i, tool_call in enumerate(response.tool_calls, 1):
            tool_name = tool_call.get('name', 'unknown')
            tool_args = tool_call.get('args', {})
            tool_call_id = tool_call.get('id', 'unknown')
            logger.info(f"  Tool call {i}: {tool_name} (id: {tool_call_id})")
            logger.info(f"    Arguments: {tool_args}")


def log_tool_call_with_response(tool_call: dict, tool_message: ToolMessage, context: str = "", preview_length: int = 2000):
    """
    Log a tool call together with its response for better visibility.
    
    This pairs each tool call with its corresponding tool response, making it easier
    to see what each tool returned immediately after it was called.
    
    Args:
        tool_call: The tool call dictionary from AIMessage.tool_calls
        tool_message: The corresponding ToolMessage with the tool's response
        context: Optional context string (e.g., node name)
        preview_length: Maximum length of response preview (default: 2000 chars for better visibility)
    """
    tool_name = tool_call.get('name', 'unknown')
    tool_args = tool_call.get('args', {})
    tool_call_id = tool_call.get('id', 'unknown')
    
    context_str = f" ({context})" if context else ""
    logger.info(f"--- Tool Call{context_str} ---")
    logger.info(f"Tool: {tool_name} (id: {tool_call_id})")
    logger.info(f"Arguments: {tool_args}")
    
    # Extract and log the tool response
    tool_content = getattr(tool_message, 'content', '')
    if isinstance(tool_content, list):
        # Handle list content (common in MCP tools)
        tool_content = str(tool_content)
    
    content_str = str(tool_content)
    logger.info(f"Response length: {len(content_str)} chars")
    
    if len(content_str) <= preview_length:
        logger.info(f"Response (full):")
        logger.info(content_str)
    else:
        preview = content_str[:preview_length]
        logger.info(f"Response (preview, {preview_length}/{len(content_str)} chars):")
        logger.info(f"{preview}...")
        logger.info(f"[Truncated - showing first {preview_length} of {len(content_str)} chars]")
    
    logger.info(f"--- End Tool Call: {tool_name} ---")


def format_tool_output_preview(content: str, max_length: int = 500) -> str:
    """
    Format a tool output preview with truncation indicator.
    
    Tool outputs (especially SQL query results) can be very long. This function
    truncates them for readability in logs while still showing the total length
    so developers know if data was cut off.
    
    Args:
        content: The full tool output content
        max_length: Maximum length for the preview (default: 500 chars)
    
    Returns:
        A formatted preview string with truncation indicator if needed
    """
    if not content:
        return "No content"
    
    content_str = str(content)
    # If content fits within max_length, return it as-is
    if len(content_str) <= max_length:
        return content_str
    
    # Truncate and add indicator showing total length
    preview = content_str[:max_length]
    total_length = len(content_str)
    return f"{preview}... [truncated, total length: {total_length} chars]"


def log_tool_messages(messages: List[Any], context: str = "", preview_length: int = 500):
    """
    Log tool messages from a list of messages with preview of outputs.
    
    After tools execute, they return ToolMessage objects with their results.
    This function extracts and logs those results, which is essential for debugging
    why the agent made certain decisions or understanding data flow between nodes.
    
    Args:
        messages: List of messages that may contain ToolMessage instances
        context: Optional context string to include in log messages (e.g., node name)
        preview_length: Maximum length of tool output preview (default: 500 chars)
    """
    # Filter messages to only include ToolMessage instances (tool execution results)
    tool_messages = [msg for msg in messages if isinstance(msg, ToolMessage)]
    if tool_messages:
        context_str = f" ({context})" if context else ""
        logger.info(f"Found {len(tool_messages)} tool message(s){context_str}:")
        # Log each tool's response with a preview (truncated if too long)
        for i, tool_msg in enumerate(tool_messages, 1):
            tool_name = getattr(tool_msg, 'name', 'unknown')
            tool_content = getattr(tool_msg, 'content', '')
            tool_id = getattr(tool_msg, 'tool_call_id', 'unknown')
            
            # Handle different content types
            if isinstance(tool_content, list):
                tool_content = str(tool_content)
            content_str = str(tool_content)
            
            logger.info(f"  Tool message {i}: {tool_name} (call_id: {tool_id})")
            logger.info(f"    Response length: {len(content_str)} chars")
            # Format preview to avoid log spam from large outputs (e.g., SQL results)
            content_preview = format_tool_output_preview(content_str, preview_length)
            logger.info(f"    Response preview: {content_preview}")


def log_tool_calls_with_responses(ai_response: AIMessage, messages: List[BaseMessage], context: str = ""):
    """
    Log tool calls paired with their corresponding responses for better visibility.
    
    This function matches each tool call from an AI response with its corresponding
    tool message response, showing them together for easier debugging.
    
    Args:
        ai_response: The AIMessage containing tool calls
        messages: List of all messages (should include ToolMessage responses)
        context: Optional context string (e.g., node name)
    """
    if not hasattr(ai_response, 'tool_calls') or not ai_response.tool_calls:
        return
    
    context_str = f" ({context})" if context else ""
    logger.info(f"Tool Calls and Responses{context_str}:")
    
    # Create a map of tool_call_id -> ToolMessage for quick lookup
    tool_message_map = {}
    for msg in messages:
        if isinstance(msg, ToolMessage):
            tool_call_id = getattr(msg, 'tool_call_id', None)
            if tool_call_id:
                tool_message_map[tool_call_id] = msg
    
    # Log each tool call with its response
    for i, tool_call in enumerate(ai_response.tool_calls, 1):
        tool_call_id = tool_call.get('id', 'unknown')
        tool_name = tool_call.get('name', 'unknown')
        tool_args = tool_call.get('args', {})
        
        logger.info(f"\n  [{i}] Tool Call: {tool_name}")
        logger.info(f"      Call ID: {tool_call_id}")
        logger.info(f"      Arguments: {tool_args}")
        
        # Find corresponding tool message
        tool_message = tool_message_map.get(tool_call_id)
        if tool_message:
            tool_content = getattr(tool_message, 'content', '')
            if isinstance(tool_content, list):
                tool_content = str(tool_content)
            
            content_str = str(tool_content)
            logger.info(f"      Response length: {len(content_str)} chars")
            
            # Show full response if reasonable, otherwise preview
            if len(content_str) <= 2000:
                logger.info(f"      Response (full):")
                # Split into lines for better readability
                for line in content_str.split('\n')[:50]:  # Limit to first 50 lines
                    logger.info(f"        {line}")
                if content_str.count('\n') > 50:
                    logger.info(f"        ... [showing first 50 lines of {content_str.count('\n') + 1} total lines]")
            else:
                preview = content_str[:2000]
                logger.info(f"      Response (preview, first 2000/{len(content_str)} chars):")
                for line in preview.split('\n')[:30]:  # Limit preview to first 30 lines
                    logger.info(f"        {line}")
                if preview.count('\n') > 30:
                    logger.info(f"        ... [truncated]")
                logger.info(f"      [Full response: {len(content_str)} chars - truncated for readability]")
        else:
            logger.warning(f"      ⚠ No response found for tool call {tool_call_id}")
    
    logger.info("")  # Empty line for separation


def log_node_input(user_input: str, node_name: str = ""):
    """
    Log the input to a node.
    
    Records what data/query the node is processing. This helps trace the flow
    of information through the workflow and understand what triggered each node.
    
    Args:
        user_input: The user input/query being processed
        node_name: Optional node name for context (helps identify which node is logging)
    """
    node_str = f" ({node_name})" if node_name else ""
    logger.info(f"Node input{node_str}:")
    logger.info(f"  User query: {user_input}")


def log_node_response(response: AIMessage, node_name: str = "", preview_length: int = None):
    """
    Log the LLM response from a node.
    
    Records what the LLM generated in response to the node's input. This is crucial
    for understanding agent reasoning and debugging why certain decisions were made.
    Can log full response or truncated preview depending on length.
    
    Args:
        response: The LLM response (AIMessage) from the node
        node_name: Optional node name for context (helps identify which node is logging)
        preview_length: Maximum length of response preview (None = full response, default: None)
    """
    node_str = f" ({node_name})" if node_name else ""
    # Extract content from response (handles different message types)
    response_content = response.content if hasattr(response, 'content') else str(response)
    
    if preview_length is None:
        # Log full response (useful for short responses or when debugging specific issues)
        logger.info(f"Agent response{node_str} (full):")
        logger.info(response_content)
    else:
        # Log preview only (prevents log spam from very long LLM outputs)
        response_preview = format_tool_output_preview(response_content, preview_length)
        logger.info(f"Agent response{node_str}: {response_preview}")


def log_route_decision(route: str):
    """
    Log the routing decision.
    
    Args:
        route: The selected route
    """
    logger.info(f"Route: {route}")


def log_tool_message_details(tool_message: ToolMessage, preview_length: int = 1000):
    """
    Log detailed information about a tool message for debugging.
    
    This function logs the tool message name, call ID, content type, structure,
    and a preview of the extracted content. Useful for debugging tool message
    extraction issues.
    
    Args:
        tool_message: The ToolMessage to log details about
        preview_length: Maximum length of content preview to show (default: 1000 chars)
    """
    tool_name = getattr(tool_message, 'name', 'unknown')
    tool_call_id = getattr(tool_message, 'tool_call_id', 'unknown')
    raw_content = getattr(tool_message, 'content', '')
    
    logger.info(f"Found tool message: {tool_name} (call_id: {tool_call_id})")
    logger.info(f"Raw content type: {type(raw_content).__name__}")
    
    if isinstance(raw_content, list):
        logger.info(f"Content is list with {len(raw_content)} items")
        if raw_content and isinstance(raw_content[0], dict):
            logger.info(f"First item keys: {list(raw_content[0].keys())}")


def log_extracted_content_preview(content: str, label: str = "Content", preview_length: int = 1000):
    """
    Log a preview of extracted content with length information.
    
    Args:
        content: The content string to log
        label: Label for the content (e.g., "Prospect data")
        preview_length: Maximum length of preview to show (default: 1000 chars)
    """
    logger.info(f"{label} (length: {len(content)} chars)")
    if len(content) > preview_length:
        logger.info(f"{label} preview (first {preview_length}/{len(content)} chars): {content[:preview_length]}")
    else:
        logger.info(f"{label} preview: {content}")

