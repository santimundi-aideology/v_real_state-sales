"""
Logging utility functions for agent nodes.

This module provides helper functions for consistent logging across all nodes,
including node entry/exit logging, tool call logging, and debug information.
"""

import logging
from typing import List, Any, Optional
from langchain_core.messages import ToolMessage, AIMessage

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
            logger.info(f"  Tool call {i}: {tool_name}")
            logger.info(f"    Arguments: {tool_args}")


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
            # Format preview to avoid log spam from large outputs (e.g., SQL results)
            content_preview = format_tool_output_preview(tool_content, preview_length)
            logger.info(f"  Tool message {i}: {tool_name}")
            logger.info(f"    Response preview: {content_preview}")


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

