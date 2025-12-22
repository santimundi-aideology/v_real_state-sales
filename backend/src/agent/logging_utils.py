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
    
    Args:
        node_name: Name of the node being entered
    """
    logger.info("=" * 80)
    logger.info(f">>> NODE: {node_name}")
    logger.info("=" * 80)


def log_tool_calls(response: AIMessage, context: str = ""):
    """
    Log tool calls from an LLM response.
    
    Args:
        response: The LLM response (AIMessage) that may contain tool calls
        context: Optional context string to include in log messages
    """
    if hasattr(response, 'tool_calls') and response.tool_calls:
        context_str = f" ({context})" if context else ""
        logger.info(f"LLM made {len(response.tool_calls)} tool call(s){context_str}:")
        for i, tool_call in enumerate(response.tool_calls, 1):
            tool_name = tool_call.get('name', 'unknown')
            tool_args = tool_call.get('args', {})
            logger.info(f"  Tool call {i}: {tool_name}")
            logger.info(f"    Arguments: {tool_args}")


def format_tool_output_preview(content: str, max_length: int = 500) -> str:
    """
    Format a tool output preview with truncation indicator.
    
    Args:
        content: The full tool output content
        max_length: Maximum length for the preview
    
    Returns:
        A formatted preview string with truncation indicator if needed
    """
    if not content:
        return "No content"
    
    content_str = str(content)
    if len(content_str) <= max_length:
        return content_str
    
    preview = content_str[:max_length]
    total_length = len(content_str)
    return f"{preview}... [truncated, total length: {total_length} chars]"


def log_tool_messages(messages: List[Any], context: str = "", preview_length: int = 500):
    """
    Log tool messages from a list of messages with preview of outputs.
    
    Args:
        messages: List of messages that may contain ToolMessage instances
        context: Optional context string to include in log messages
        preview_length: Maximum length of tool output preview (default: 500)
    """
    tool_messages = [msg for msg in messages if isinstance(msg, ToolMessage)]
    if tool_messages:
        context_str = f" ({context})" if context else ""
        logger.info(f"Found {len(tool_messages)} tool message(s){context_str}:")
        for i, tool_msg in enumerate(tool_messages, 1):
            tool_name = getattr(tool_msg, 'name', 'unknown')
            tool_content = getattr(tool_msg, 'content', '')
            content_preview = format_tool_output_preview(tool_content, preview_length)
            logger.info(f"  Tool message {i}: {tool_name}")
            logger.info(f"    Response preview: {content_preview}")


def log_node_input(user_input: str, node_name: str = ""):
    """
    Log the input to a node.
    
    Args:
        user_input: The user input/query
        node_name: Optional node name for context
    """
    node_str = f" ({node_name})" if node_name else ""
    logger.info(f"Node input{node_str}:")
    logger.info(f"  User query: {user_input}")


def log_node_response(response: AIMessage, node_name: str = "", preview_length: int = 500):
    """
    Log the LLM response from a node with preview.
    
    Args:
        response: The LLM response
        node_name: Optional node name for context
        preview_length: Maximum length of response preview (default: 500)
    """
    node_str = f" ({node_name})" if node_name else ""
    response_content = response.content if hasattr(response, 'content') else str(response)
    response_preview = format_tool_output_preview(response_content, preview_length)
    logger.info(f"Agent response{node_str}: {response_preview}")


def log_route_decision(route: str):
    """
    Log the routing decision.
    
    Args:
        route: The selected route
    """
    logger.info(f"Route: {route}")

