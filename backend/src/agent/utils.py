"""
Utility functions for agent operations.
"""

import os
import json
import logging
import random
import requests
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from langchain_core.messages import BaseMessage, ToolMessage
from src.mcp.supabase import get_supabase_client
from src.agent.state import CustomerData

logger = logging.getLogger(__name__)


def get_last_tool_message(messages: List[BaseMessage]) -> Optional[ToolMessage]:
    """
    Extract the last tool message from a list of messages.
    
    Args:
        messages: List of messages from the state
        
    Returns:
        The last ToolMessage if found, None otherwise
    """
    if not messages:
        return None
    
    # Iterate in reverse to find the last tool message
    for msg in reversed(messages):
        if isinstance(msg, ToolMessage):
            return msg
    
    return None


def format_value(value):
    """
    Format a value for display in formatted strings.
    
    Args:
        value: The value to format (can be None, bool, str, int, float, etc.)
    
    Returns:
        A string representation of the value:
        - None values return "NULL"
        - Boolean values return lowercase string ("true"/"false")
        - Other values return their string representation
    """
    if value is None:
        return "NULL"
    elif isinstance(value, bool):
        return str(value).lower()
    else:
        return str(value)


def format_prospect_row(prospect: dict) -> str:
    """
    Format a prospect dictionary into a single-line string with all fields.
    
    Args:
        prospect: A dictionary containing prospect data from the database
    
    Returns:
        A formatted string with all prospect fields in key=value format,
        separated by commas
    """
    row_parts = [
        f"id={format_value(prospect.get('id'))}",
        f"full_name={format_value(prospect.get('full_name'))}",
        f"language={format_value(prospect.get('language'))}",
        f"city={format_value(prospect.get('city'))}",
        f"primary_segment={format_value(prospect.get('primary_segment'))}",
        f"phone={format_value(prospect.get('phone'))}",
        f"whatsapp_number={format_value(prospect.get('whatsapp_number'))}",
        f"email={format_value(prospect.get('email'))}",
        f"preferred_channel={format_value(prospect.get('preferred_channel'))}",
        f"consent_status={format_value(prospect.get('consent_status'))}",
        f"dnc={format_value(prospect.get('dnc'))}",
        f"budget_min={format_value(prospect.get('budget_min'))}",
        f"budget_max={format_value(prospect.get('budget_max'))}",
        f"property_type_pref={format_value(prospect.get('property_type_pref'))}",
        f"beds_min={format_value(prospect.get('beds_min'))}",
        f"created_at={format_value(prospect.get('created_at'))}",
        f"updated_at={format_value(prospect.get('updated_at'))}",
    ]
    
    return ", ".join(row_parts)




def create_campaign_record(
    name: str,
    target_city: str,
    target_segment: str,
    channels: List[str],
    agent_persona: str,
    created_by: str,
    respect_dnc: bool = True,
    require_consent: bool = True,
    record_conversations: bool = True,
    active_window_start: Optional[str] = None,
    active_window_end: Optional[str] = None,
    contacted_prospects: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Create a new campaign record in the campaigns table.
    
    Args:
        name: Campaign name
        target_city: 'riyadh', 'jeddah', or 'all'
        target_segment: 'hnw', 'investor', 'first_time', or 'all'
        channels: List of channels ('call', 'sms', 'whatsapp', 'email')
        agent_persona: Agent persona/script text
        created_by: Creator identifier (user role)
        respect_dnc: Whether to respect DNC list (default True)
        require_consent: Whether to require consent (default True)
        record_conversations: Whether to record conversations (default True)
        active_window_start: Optional start time in 'HH:MM:SS' format
        active_window_end: Optional end time in 'HH:MM:SS' format
        contacted_prospects: Optional list of contacted prospect data (for JSONB field)
    
    Returns:
        Dictionary with 'success' (bool) and either 'campaign_id' (str) or 'error' (str)
    """
    try:
        supabase = get_supabase_client()
        
        # Prepare campaign data for insertion
        insert_data: Dict[str, Any] = {
            'name': name,
            'target_city': target_city.lower(),
            'target_segment': target_segment.lower(),
            'channels': channels,
            'agent_persona': agent_persona,
            'respect_dnc': respect_dnc,
            'require_consent': require_consent,
            'record_conversations': record_conversations,
            'created_by': created_by,
        }
        
        # Add optional time window fields if provided
        if active_window_start:
            insert_data['active_window_start'] = active_window_start
        if active_window_end:
            insert_data['active_window_end'] = active_window_end
        
        # Add contacted_prospects as JSONB array
        if contacted_prospects is not None:
            insert_data['contacted_prospects'] = contacted_prospects
        else:
            insert_data['contacted_prospects'] = []
        
        # Calculate metrics
        total_outreach = len(contacted_prospects) if contacted_prospects else 0
        connect_rate = 100.0  # Always 100%
        
        # Generate response_rate: random between 0-100%, but mostly above 50%
        # Use a weighted approach: 70% chance of being 50-100%, 30% chance of being 0-50%
        if random.random() < 0.7:
            response_rate = round(random.uniform(50.0, 100.0), 2)
        else:
            response_rate = round(random.uniform(0.0, 50.0), 2)
        
        # click_rate: same as response_rate
        click_rate = response_rate
        
        # booked_appointments: random between 0 and total_outreach, skewed towards half or less
        # Use a weighted approach: 80% chance of being <= half, 20% chance of being > half
        if total_outreach == 0:
            booked_appointments = 0
        else:
            half_prospects = total_outreach // 2
            if random.random() < 0.8:
                # Skewed towards half or less
                booked_appointments = random.randint(0, half_prospects)
            else:
                # Can be more than half, but still within bounds
                booked_appointments = random.randint(half_prospects + 1, total_outreach)
        
        # Add calculated metrics to insert_data
        insert_data['total_outreach'] = total_outreach
        insert_data['connect_rate'] = connect_rate
        insert_data['response_rate'] = response_rate
        insert_data['click_rate'] = click_rate
        insert_data['booked_appointments'] = booked_appointments
        
        logger.info(f"create_campaign_record - Metrics: outreach={total_outreach}, connect={connect_rate}%, "
                   f"response={response_rate}%, click={click_rate}%, appointments={booked_appointments}")
        
        # Insert campaign
        response = supabase.table("campaigns").insert(insert_data).execute()
        
        if hasattr(response, 'error') and response.error:
            error_msg = f"Database insert error: {response.error}"
            logger.error(f"create_campaign_record - {error_msg}")
            return {'success': False, 'error': error_msg}
        
        if not response.data or len(response.data) == 0:
            logger.error("create_campaign_record - No data returned from insert")
            return {'success': False, 'error': 'Campaign creation failed - no data returned'}
        
        campaign_id = response.data[0].get('id')
        campaign_name = response.data[0].get('name')
        
        logger.info(f"create_campaign_record - Successfully created campaign: {campaign_name} (ID: {campaign_id})")
        
        return {'success': True, 'campaign_id': str(campaign_id), 'campaign_name': campaign_name}
        
    except Exception as e:
        error_msg = f"Failed to create campaign: {str(e)}"
        logger.error(f"create_campaign_record - {error_msg}", exc_info=True)
        return {'success': False, 'error': error_msg}




def serialize_customer_data(customer_data: List[CustomerData]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Serialize CustomerData list to JSON-serializable format for frontend display.
    Also builds contacted_prospects list for campaign record.
    
    Args:
        customer_data: List of CustomerData objects to serialize
    
    Returns:
        Tuple of (serialized_data, contacted_prospects):
        - serialized_data: List of dictionaries for frontend display
        - contacted_prospects: List of dictionaries for campaign record
    """
    serialized_data = []
    contacted_prospects = []
    
    for customer in customer_data:
        # Serialize for frontend display
        customer_dict = {
            "name": customer.name,
            "preferred_channel": customer.preferred_channel,
            "contact": customer.contact,
            "language": customer.language,
            "city": customer.city,
            "primary_segment": customer.primary_segment,
            "budget_max": customer.budget_max,
            "property_type_pref": customer.property_type_pref,
            "dnc": customer.dnc,
            "consent_status": customer.consent_status,
        }
        serialized_data.append(customer_dict)
        
        # Build contacted_prospects entry for campaign record
        contacted_prospects.append({
            "name": customer.name,
            "contact": customer.contact,
            "channel": customer.preferred_channel,
            "language": customer.language,
            "city": customer.city,
            "primary_segment": customer.primary_segment,
            "budget_max": customer.budget_max,
            "property_type_pref": customer.property_type_pref,
            "dnc": customer.dnc,
            "consent_status": customer.consent_status,
        })
    
    logger.info(f"serialize_customer_data - Serialized {len(serialized_data)} customer(s) to JSON format")
    
    return serialized_data, contacted_prospects




def _load_refresh_token(path: Optional[str] = None) -> str:
    """
    Load refresh token from ms_tokens.json file.
    
    Args:
        path: Optional path to tokens file. Defaults to backend/ms_tokens.json
    
    Returns:
        Refresh token string
    
    Raises:
        RuntimeError: If file doesn't exist or refresh_token not found
    """
    if path is None:
        # Default to backend/ms_tokens.json (relative to backend directory)
        backend_dir = Path(__file__).parent.parent.parent
        path = str(backend_dir / "ms_tokens.json")
    
    if not os.path.exists(path):
        raise RuntimeError(f"ms_tokens.json not found at {path}. Re-run the OAuth connect flow via ms_auth.py")
    
    with open(path, "r", encoding="utf-8") as f:
        tokens = json.load(f)
    
    rt = tokens.get("refresh_token")
    if not rt:
        raise RuntimeError("refresh_token not found in ms_tokens.json. Re-run the connect flow.")
    
    return rt



def _save_refresh_token(refresh_token: str, path: Optional[str] = None) -> None:
    """
    Save refresh token to ms_tokens.json file.
    
    Args:
        refresh_token: Refresh token to save
        path: Optional path to tokens file. Defaults to backend/ms_tokens.json
    """
    if path is None:
        # Default to backend/ms_tokens.json (relative to backend directory)
        backend_dir = Path(__file__).parent.parent.parent
        path = str(backend_dir / "ms_tokens.json")
    
    # Keep just what we need
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"refresh_token": refresh_token}, f, indent=2)




def _refresh_access_token(refresh_token: str) -> Tuple[str, str]:
    """
    Refresh Microsoft access token using refresh token.
    
    Args:
        refresh_token: Microsoft refresh token
    
    Returns:
        Tuple of (access_token, refresh_token_after_rotation)
    
    Raises:
        RuntimeError: If token refresh fails
    """
    tenant_id = os.environ.get("MS_TENANT_ID")
    client_id = os.environ.get("MS_CLIENT_ID")
    client_secret = os.environ.get("MS_CLIENT_SECRET")
    
    if not all([tenant_id, client_id, client_secret]):
        raise RuntimeError("Missing Microsoft OAuth credentials. Set MS_TENANT_ID, MS_CLIENT_ID, and MS_CLIENT_SECRET environment variables.")
    
    token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "scope": "https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.Send",
    }
    
    try:
        r = requests.post(token_url, data=data, timeout=30)
        r.raise_for_status()
        j = r.json()
        return j["access_token"], j.get("refresh_token", refresh_token)
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Failed to refresh access token: {str(e)}")



def send_email_via_graph(to_email: str, subject: str, html: str, token_path: Optional[str] = None) -> None:
    """
    Send an email via Microsoft Graph API.
    
    Requires ms_tokens.json containing {"refresh_token": "..."} in the backend directory.
    Automatically refreshes the access token if needed.
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html: Email body (HTML format)
        token_path: Optional path to tokens file. Defaults to backend/ms_tokens.json
    
    Raises:
        RuntimeError: If token loading, refresh, or email sending fails
    """
    rt = _load_refresh_token(token_path)
    access_token, new_rt = _refresh_access_token(rt)
    
    # Refresh token rotation happens sometimes — persist the new one if returned
    if new_rt != rt:
        _save_refresh_token(new_rt, token_path)
    
    payload = {
        "message": {
            "subject": subject,
            "body": {"contentType": "HTML", "content": html},
            "toRecipients": [{"emailAddress": {"address": to_email}}],
        },
        "saveToSentItems": True,
    }
    
    try:
        r = requests.post(
            "https://graph.microsoft.com/v1.0/me/sendMail",
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
            json=payload,
            timeout=30,
        )
        
        # Success is commonly 202 Accepted
        if r.status_code != 202:
            raise RuntimeError(f"Graph sendMail failed: {r.status_code} {r.text}")
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Failed to send email via Microsoft Graph: {str(e)}")
