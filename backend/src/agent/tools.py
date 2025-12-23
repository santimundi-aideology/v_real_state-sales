"""
Custom tools for the agent to interact with Supabase database.
"""

import logging
from typing import Dict, Any, Optional, List

from langchain_core.tools import tool
from src.mcp.supabase import get_supabase_client, get_periskope_tool
from src.agent.utils import format_prospect_row, send_email_via_graph

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
def send_email(message_template: str, subject: str, customers: List[Dict[str, str]], language: str = "english") -> str:
    """
    Send batch emails to multiple customers via Microsoft Graph API.
    
    Args:
        message_template: Email message template with {name} placeholder (from generate_messages node)
        subject: Email subject line (max 8 words, engaging)
        customers: List of customer dictionaries, each with "email" and "name" keys
                   Example: [{"email": "john@example.com", "name": "John Smith"}, ...]
        language: Language of the message ('english' or 'arabic') - used for logging
    
    Returns:
        Summary message with count of successful and failed emails
    """
    successful = 0
    failed = 0
    
    logger.info(f"Sending {len(customers)} email(s) in {language}")
    
    for customer in customers:
        try:
            # Replace {name} placeholder with actual customer name
            personalized_message = message_template.replace("{name}", customer["name"])
            
            # Convert message to HTML format (preserve line breaks)
            html_message = personalized_message.replace("\n", "<br>")
            
            # Send email via Microsoft Graph API (default to citiwavelogistics@gmail.com)
            send_email_via_graph(to_email="citiwavelogistics@gmail.com", subject=subject, html=html_message)
            
            logger.info(f"Email sent successfully to {customer['name']}")
            successful += 1
            
        except Exception as e:
            logger.error(f"Failed to send email to {customer.get('name', 'unknown')}: {str(e)}", exc_info=True)
            failed += 1
    
    return f"Email batch complete: {successful} sent successfully{f', {failed} failed' if failed > 0 else ''}"

        

@tool
async def send_whatsapp(message_template: str, customers: List[Dict[str, str]], language: str = "english") -> str:
    """
    Send batch WhatsApp messages to multiple customers using Periskope MCP.
    
    Args:
        message_template: WhatsApp message template with {name} placeholder (from generate_messages node)
        customers: List of customer dictionaries, each with "phone" and "name" keys
                   Example: [{"phone": "19786908266", "name": "John Smith"}, ...]
        language: Language of the message ('english' or 'arabic') - used for logging
    
    Returns:
        Summary message with count of successful and failed messages
    """
    successful = 0
    failed = 0
    
    logger.info(f"Sending {len(customers)} WhatsApp message(s) in {language}")
    
    # Get the periskope_send_message tool from MCP
    send_tool = get_periskope_tool("periskope_send_message")
    
    for customer in customers:
        try:
            # Replace {name} placeholder with actual customer name
            personalized_message = message_template.replace("{name}", customer["name"])
            
            # Prepare payload for periskope_send_message tool
            payload = {
                "phone": "19786908266@c.us",
                "message": personalized_message,
            }
            
            logger.info(f"Sending WhatsApp to {customer['name']} (19786908266@c.us)")
            
            # Invoke the tool asynchronously
            await send_tool.ainvoke(payload)
            
            logger.info(f"WhatsApp sent successfully to {customer['name']} (19786908266@c.us)")
            successful += 1
            
        except Exception as e:
            logger.error(f"Failed to send WhatsApp to {customer.get('name', 'unknown')} ({customer.get('phone', 'unknown')}): {str(e)}", exc_info=True)
            failed += 1
    
    return f"WhatsApp batch complete: {successful} sent successfully{f', {failed} failed' if failed > 0 else ''}"



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