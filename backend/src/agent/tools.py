"""
Custom tools for the agent to interact with Supabase database.
"""

import logging
from typing import Dict, Any, Optional

from langchain_core.tools import tool
from src.mcp.supabase import get_supabase_client, get_periskope_tool
from src.agent.utils import format_prospect_row

logger = logging.getLogger(__name__)


@tool
def list_prospects() -> str:
    """
    Query the prospects table to list all prospects from the database.
    
    Returns:
        A formatted string with each prospect row separated by newlines.
        Each row contains: id, full_name, language, city, primary_segment, phone, 
        whatsapp_number, email, preferred_channel, consent_status, dnc, budget_min, 
        budget_max, property_type_pref, beds_min, created_at, updated_at.
        Returns an error message if the query fails.
    """
    try:
        supabase = get_supabase_client()

        # Query all prospects from the table
        response = supabase.table("prospects").select("*").execute()
        
        if hasattr(response, 'error') and response.error:
            error_msg = f"Database query error: {response.error}"
            logger.error(error_msg)
            return f"Error: {error_msg}"

        # Check if any prospects were found
        if not response.data or len(response.data) == 0:
            logger.info("list_prospects - No prospects found in database")
            return "No prospects found in the database."

        logger.info(f"list_prospects - Found {len(response.data)} prospect(s)")

        # Format each prospect as a single line with all fields
        formatted_rows = [format_prospect_row(prospect) for prospect in response.data]

        # Join all rows with newlines
        result = "\n".join(formatted_rows)
        
        logger.info(f"list_prospects - Returning {len(formatted_rows)} formatted prospect row(s)")
        
        return result

    except Exception as e:
        error_msg = f"Failed to list prospects: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return f"Error: {error_msg}"


@tool
def create_campaign(campaign_data: Dict[str, Any]) -> str:
    """
    Create a new campaign in the campaigns table.
    
    Args:
        campaign_data: Dictionary containing campaign fields:
            - name (str, required): Campaign name
            - target_city (str, required): 'riyadh', 'jeddah', or 'all'
            - target_segment (str, required): 'hnw', 'investor', 'first_time', or 'all'
            - active_window_start (str, optional): Time in 'HH:MM:SS' format
            - active_window_end (str, optional): Time in 'HH:MM:SS' format
            - channels (list[str], required): Array of 'call', 'whatsapp', 'email'
            - agent_persona (str, required): Agent persona/script
            - respect_dnc (bool, optional): Default True
            - require_consent (bool, optional): Default True
            - record_conversations (bool, optional): Default True
            - created_by (str, optional): Creator identifier, default 'system'
    
    Returns:
        Success message with campaign ID, or error message if creation fails.
    """
    try:
        supabase = get_supabase_client()
        
        # Validate required fields
        required_fields = ['name', 'target_city', 'target_segment', 'channels', 'agent_persona']
        for field in required_fields:
            if field not in campaign_data:
                error_msg = f"Missing required field: {field}"
                logger.error(f"create_campaign - {error_msg}")
                return f"Error: {error_msg}"
        
        # Prepare campaign data for insertion
        insert_data = {
            'name': campaign_data['name'],
            'target_city': campaign_data['target_city'].lower(),
            'target_segment': campaign_data['target_segment'].lower(),
            'channels': campaign_data['channels'],
            'agent_persona': campaign_data['agent_persona'],
            'respect_dnc': campaign_data.get('respect_dnc', True),
            'require_consent': campaign_data.get('require_consent', True),
            'record_conversations': campaign_data.get('record_conversations', True),
            'created_by': campaign_data.get('created_by', 'system'),
        }
        
        # Add optional time window fields if provided
        if 'active_window_start' in campaign_data:
            insert_data['active_window_start'] = campaign_data['active_window_start']
        if 'active_window_end' in campaign_data:
            insert_data['active_window_end'] = campaign_data['active_window_end']
        
        # Insert campaign
        response = supabase.table("campaigns").insert(insert_data).execute()
        
        if hasattr(response, 'error') and response.error:
            error_msg = f"Database insert error: {response.error}"
            logger.error(f"create_campaign - {error_msg}")
            return f"Error: {error_msg}"
        
        if not response.data or len(response.data) == 0:
            logger.error("create_campaign - No data returned from insert")
            return "Error: Campaign creation failed - no data returned"
        
        campaign_id = response.data[0].get('id')
        campaign_name = response.data[0].get('name')
        
        logger.info(f"create_campaign - Successfully created campaign: {campaign_name} (ID: {campaign_id})")
        
        return f"Successfully created campaign '{campaign_name}' with ID: {campaign_id}"
        
    except Exception as e:
        error_msg = f"Failed to create campaign: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return f"Error: {error_msg}"


@tool
def send_email(to: str, subject: str, message: str, language: str = "english") -> str:
    """
    Send an email to a customer.
    
    Args:
        to: Email address
        subject: Email subject line
        message: Email body (use the pre-generated message from generated_messages)
        language: Language of the message ('english' or 'arabic')
    
    Returns:
        Success or error message
    """
    try:
        logger.info(f"Sending email to {to} in {language}")
        # TODO: Implement actual email sending logic
        # For now, just log and return success
        return f"Email sent successfully to {to}"
    except Exception as e:
        error_msg = f"Failed to send email: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return f"Error: {error_msg}"


@tool
async def send_whatsapp(message: str, to: str) -> str:
    """
    Send a WhatsApp message to a customer using Periskope MCP.
    
    Args:
        message: Message text (use the pre-generated message from generated_messages)
        to: WhatsApp number (will be formatted as phone@c.us if needed). Defaults to 19786908266 for testing.
    
    Returns:
        Success message with queue_id, or error message if sending fails
    """

    to = "19786908266"
    try:
        logger.info(f"Sending WhatsApp to {to}")
        
        # Get the periskope_send_message tool from MCP
        send_tool = get_periskope_tool("periskope_send_message")
        
        if not send_tool:
            error_msg = "periskope_send_message tool not available. Ensure periskope-mcp server is initialized."
            logger.error(error_msg)
            return f"Error: {error_msg}"
        
        # Format phone number according to Periskope format: 919826000000@c.us
        # If phone number doesn't already have @c.us, add it
        if "@c.us" not in to:
            formatted_phone = f"{to}@c.us"
        else:
            formatted_phone = to
        
        # Prepare payload for periskope_send_message tool
        payload = {
            "phone": formatted_phone,
            "message": message,
        }
        
        logger.info(f"Invoking periskope_send_message with phone: {formatted_phone}")
        
        # Invoke the tool asynchronously (we're in an async context)
        result = await send_tool.ainvoke(payload)
        
        # Extract the result text from the response
        # The result is typically a list of message objects
        if isinstance(result, list) and len(result) > 0:
            result_text = result[0].get('text', str(result[0])) if isinstance(result[0], dict) else str(result[0])
        else:
            result_text = str(result)
        
        logger.info(f"WhatsApp send result: {result_text}")
        
        # Return a user-friendly success message
        if "Message sent successfully" in result_text or "queue_id" in result_text:
            return f"WhatsApp message sent successfully to {to}. {result_text}"
        else:
            return f"WhatsApp message sent to {to}. Response: {result_text}"
        
    except Exception as e:
        error_msg = f"Failed to send WhatsApp: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return f"Error: {error_msg}"


@tool
def send_phone_text(to: str, message: str, language: str = "english") -> str:
    """
    Send a text message via phone/SMS to a customer.
    
    Args:
        to: Phone number
        message: Message text (use the pre-generated message from generated_messages)
        language: Language of the message ('english' or 'arabic')
    
    Returns:
        Success or error message
    """
    try:
        logger.info(f"Sending phone text to {to} in {language}")
        # TODO: Implement actual SMS/phone text sending logic
        # For now, just log and return success
        return f"Phone text sent successfully to {to}"
    except Exception as e:
        error_msg = f"Failed to send phone text: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return f"Error: {error_msg}"


def get_db_tools():
    return [list_prospects, create_campaign]


def get_messaging_tools():
    return [send_email, send_whatsapp, send_phone_text]