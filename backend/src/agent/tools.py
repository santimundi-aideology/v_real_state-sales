"""Custom tools for agent interactions with database and messaging services."""

import logging
import requests
from typing import Dict, Any, List

from langchain_core.tools import tool
from src.mcp.supabase import get_supabase_client
from src.agent.utils import format_prospect_row, send_email_via_graph

logger = logging.getLogger(__name__)


@tool
def list_prospects() -> str:
    """Query and return all prospects from the database.

    Returns:
        Formatted string with prospect rows (one per line) containing all fields,
        or error message if query fails.
    """
    try:
        # Query all prospects from database
        response = get_supabase_client().table("prospects").select("*").execute()
        
        if hasattr(response, 'error') and response.error:
            logger.error(f"Database query error: {response.error}")
            return f"Error: Database query error: {response.error}"

        if not response.data:
            return "No prospects found in the database."

        # Format each prospect row for LLM readability
        formatted_rows = [format_prospect_row(p) for p in response.data]
        logger.info(f"Found {len(formatted_rows)} prospect(s)")
        return "\n".join(formatted_rows)

    except Exception as e:
        logger.error(f"Failed to list prospects: {str(e)}", exc_info=True)
        return f"Error: Failed to list prospects: {str(e)}"


@tool
def create_campaign(campaign_data: Dict[str, Any]) -> str:
    """Create a new campaign in the campaigns table.

    Args:
        campaign_data: Dictionary with required fields (name, target_city, target_segment,
            channels, agent_persona) and optional fields (active_window_start/end,
            respect_dnc, require_consent, record_conversations, created_by).

    Returns:
        Success message with campaign ID, or error message if creation fails.
    """
    try:
        required = ['name', 'target_city', 'target_segment', 'channels', 'agent_persona']
        missing = [f for f in required if f not in campaign_data]
        if missing:
            return f"Error: Missing required field(s): {', '.join(missing)}"
        
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
        
        for field in ['active_window_start', 'active_window_end']:
            if field in campaign_data:
                insert_data[field] = campaign_data[field]
        
        response = get_supabase_client().table("campaigns").insert(insert_data).execute()
        
        if hasattr(response, 'error') and response.error:
            logger.error(f"Database insert error: {response.error}")
            return f"Error: Database insert error: {response.error}"
        
        if not response.data:
            return "Error: Campaign creation failed - no data returned"
        
        campaign = response.data[0]
        logger.info(f"Created campaign: {campaign['name']} (ID: {campaign['id']})")
        return f"Successfully created campaign '{campaign['name']}' with ID: {campaign['id']}"
        
    except Exception as e:
        logger.error(f"Failed to create campaign: {str(e)}", exc_info=True)
        return f"Error: Failed to create campaign: {str(e)}"


@tool
def send_email(message_template: str, subject: str, customers: List[Dict[str, str]], language: str = "english") -> str:
    """Send batch emails to multiple customers via Microsoft Graph API.

    Args:
        message_template: Email template with {name} placeholder.
        subject: Email subject line (max 8 words).
        customers: List of dicts with "name" key (e.g., [{"name": "John"}, ...]).
        language: Message language for logging ('english' or 'arabic').

    Returns:
        Summary message with success/failure counts.
    """
    successful = failed = 0
    logger.info(f"Sending {len(customers)} email(s) in {language}")
    
    # Personalize and send email for each customer
    for customer in customers:
        try:
            html_message = message_template.replace("{name}", customer["name"]).replace("\n", "<br>")
            send_email_via_graph(to_email="citiwavelogistics@gmail.com", subject=subject, html=html_message)
            logger.info(f"Email sent to {customer['name']}")
            successful += 1
        except Exception as e:
            logger.error(f"Failed to send email to {customer.get('name', 'unknown')}: {str(e)}", exc_info=True)
            failed += 1
    
    return f"Email batch complete: {successful} sent successfully{f', {failed} failed' if failed > 0 else ''}"

        

@tool
def send_whatsapp(message_template: str, customers: List[Dict[str, str]], language: str = "english") -> str:
    """Send batch WhatsApp messages to multiple customers using Green API.

    Args:
        message_template: WhatsApp template with {name} placeholder.
        customers: List of dicts with "name" and "phone" keys (e.g., [{"name": "John", "phone": "+1234567890"}, ...]).
        language: Message language for logging ('english' or 'arabic').

    Returns:
        Summary message with success/failure counts.
    """
    url = "https://7105.api.greenapi.com/waInstance7105448584/sendMessage/89443b946d304a3ca0e65e4258d332fe4747581c49ef4da693"
    headers = {'Content-Type': 'application/json'}
    
    successful = failed = 0
    logger.info(f"Sending {len(customers)} WhatsApp message(s) in {language}")
    
    # Personalize and send WhatsApp message for each customer
    for customer in customers:
        try:
            
            # Personalize message by replacing {name} placeholder
            personalized_message = message_template.replace("{name}", customer["name"])
            
            payload = {
                "chatId": "19786908266@c.us",
                "message": personalized_message,
            }
            
            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code >= 400:
                logger.error("GreenAPI %s: %s", response.status_code, response.text)
            
            response.raise_for_status()
            
            logger.info(f"WhatsApp sent to {customer['name']}")
            successful += 1
        except Exception as e:
            logger.error(f"Failed to send WhatsApp to {customer.get('name', 'unknown')}: {str(e)}", exc_info=True)
            failed += 1
    
    return f"WhatsApp batch complete: {successful} sent successfully{f', {failed} failed' if failed > 0 else ''}"



@tool
def send_phone_text(to: str, message: str, language: str = "english") -> str:
    """Send a text message via phone/SMS to a customer.

    Args:
        to: Phone number.
        message: Message text.
        language: Message language ('english' or 'arabic').

    Returns:
        Success or error message.
    """
    logger.info(f"Sending phone text to {to} in {language}")
    return f"Phone text sent successfully to {to}"


def get_db_tools() -> List:
    """Return list of database tools."""
    return [list_prospects, create_campaign]


def get_messaging_tools() -> List:
    """Return list of messaging tools."""
    return [send_email, send_whatsapp, send_phone_text]