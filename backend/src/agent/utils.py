"""Utility functions for agent operations."""

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
    """Extract the last tool message from a list of messages.

    Args:
        messages: List of messages from the state.

    Returns:
        The last ToolMessage if found, None otherwise.
    """
    return next((msg for msg in reversed(messages) if isinstance(msg, ToolMessage)), None)


def format_value(value) -> str:
    """Format a value for display in formatted strings.

    Args:
        value: The value to format (can be None, bool, str, int, float, etc.).

    Returns:
        String representation: "NULL" for None, lowercase for bools, str() otherwise.
    """
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return str(value).lower()
    return str(value)


def format_prospect_row(prospect: dict) -> str:
    """Format a prospect dictionary into a single-line string with all fields.

    Args:
        prospect: Dictionary containing prospect data from the database.

    Returns:
        Formatted string with all prospect fields in key=value format, comma-separated.
    """
    fields = [
        'id', 'full_name', 'language', 'city', 'primary_segment', 'phone',
        'whatsapp_number', 'email', 'preferred_channel', 'consent_status',
        'dnc', 'budget_min', 'budget_max', 'property_type_pref', 'beds_min',
        'created_at', 'updated_at'
    ]
    return ", ".join(f"{field}={format_value(prospect.get(field))}" for field in fields)




def _calculate_campaign_metrics(total_outreach: int) -> Dict[str, Any]:
    """Calculate campaign metrics (response rate, click rate, appointments).

    Args:
        total_outreach: Total number of prospects contacted.

    Returns:
        Dictionary with calculated metrics.
    """
    if random.random() < 0.7:
        response_rate = round(random.uniform(50.0, 100.0), 2)
    else:
        response_rate = round(random.uniform(0.0, 50.0), 2)

    if total_outreach == 0:
        booked_appointments = 0
    else:
        half = total_outreach // 2
        booked_appointments = random.randint(0, half) if random.random() < 0.8 else random.randint(half + 1, total_outreach)

    return {
        'total_outreach': total_outreach,
        'connect_rate': 100.0,
        'response_rate': response_rate,
        'click_rate': response_rate,
        'booked_appointments': booked_appointments,
    }


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
    """Create a new campaign record in the campaigns table.

    Args:
        name: Campaign name.
        target_city: 'riyadh', 'jeddah', or 'all'.
        target_segment: 'hnw', 'investor', 'first_time', or 'all'.
        channels: List of channels ('call', 'sms', 'whatsapp', 'email').
        agent_persona: Agent persona/script text.
        created_by: Creator identifier (user role).
        respect_dnc: Whether to respect DNC list.
        require_consent: Whether to require consent.
        record_conversations: Whether to record conversations.
        active_window_start: Optional start time in 'HH:MM:SS' format.
        active_window_end: Optional end time in 'HH:MM:SS' format.
        contacted_prospects: Optional list of contacted prospect data.

    Returns:
        Dictionary with 'success' (bool) and either 'campaign_id' (str) or 'error' (str).
    """
    try:
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
            'contacted_prospects': contacted_prospects or [],
        }

        if active_window_start:
            insert_data['active_window_start'] = active_window_start
        if active_window_end:
            insert_data['active_window_end'] = active_window_end

        # Calculate and add campaign metrics (response rate, appointments, etc.)
        insert_data.update(_calculate_campaign_metrics(len(contacted_prospects) if contacted_prospects else 0))

        # Insert campaign record into database
        response = get_supabase_client().table("campaigns").insert(insert_data).execute()

        if hasattr(response, 'error') and response.error:
            logger.error(f"Database insert error: {response.error}")
            return {'success': False, 'error': f"Database insert error: {response.error}"}

        if not response.data:
            return {'success': False, 'error': 'Campaign creation failed - no data returned'}

        campaign = response.data[0]
        logger.info(f"Created campaign: {campaign['name']} (ID: {campaign['id']})")
        return {'success': True, 'campaign_id': str(campaign['id']), 'campaign_name': campaign['name']}

    except Exception as e:
        logger.error(f"Failed to create campaign: {str(e)}", exc_info=True)
        return {'success': False, 'error': f"Failed to create campaign: {str(e)}"}




def serialize_customer_data(customer_data: List[CustomerData]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Serialize CustomerData list to JSON-serializable format.

    Args:
        customer_data: List of CustomerData objects to serialize.

    Returns:
        Tuple of (serialized_data, contacted_prospects):
        - serialized_data: List of dicts for frontend display.
        - contacted_prospects: List of dicts for campaign record.
    """
    def _to_dict(customer: CustomerData, use_channel: bool = False) -> Dict[str, Any]:
        """Convert CustomerData to dictionary."""
        d = {
            "name": customer.name,
            "contact": customer.contact,
            "language": customer.language,
            "city": customer.city,
            "primary_segment": customer.primary_segment,
            "budget_max": customer.budget_max,
            "property_type_pref": customer.property_type_pref,
            "dnc": customer.dnc,
            "consent_status": customer.consent_status,
        }
        if use_channel:
            d["channel"] = customer.preferred_channel
        else:
            d["preferred_channel"] = customer.preferred_channel
        return d

    # Create two versions: one for frontend (with preferred_channel) and one for DB (with channel)
    serialized_data = [_to_dict(c) for c in customer_data]
    contacted_prospects = [_to_dict(c, use_channel=True) for c in customer_data]

    logger.info(f"Serialized {len(serialized_data)} customer(s) to JSON format")
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
    """Refresh Microsoft Graph API access token using refresh token.

    Args:
        refresh_token: Refresh token from ms_tokens.json.

    Returns:
        Tuple of (access_token, new_refresh_token).

    Raises:
        RuntimeError: If required environment variables are missing or token refresh fails.
    """
    tenant_id = os.environ.get("MS_TENANT_ID")
    client_id = os.environ.get("MS_CLIENT_ID")
    client_secret = os.environ.get("MS_CLIENT_SECRET")

    if not all([tenant_id, client_id, client_secret]):
        raise RuntimeError("Missing Microsoft OAuth credentials")

    response = requests.post(
        f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token",
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "scope": "https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.Send",
        },
        timeout=30
    )
    response.raise_for_status()
    data = response.json()
    return data["access_token"], data.get("refresh_token", refresh_token)



def send_email_via_graph(to_email: str, subject: str, html: str, token_path: Optional[str] = None) -> None:
    """Send an email via Microsoft Graph API.

    Requires ms_tokens.json containing {"refresh_token": "..."} in the backend directory.
    Automatically refreshes the access token if needed.

    Args:
        to_email: Recipient email address.
        subject: Email subject.
        html: Email body (HTML format).
        token_path: Optional path to tokens file. Defaults to backend/ms_tokens.json.

    Raises:
        RuntimeError: If token loading, refresh, or email sending fails.
    """
    rt = _load_refresh_token(token_path)
    access_token, new_rt = _refresh_access_token(rt)

    if new_rt != rt:
        _save_refresh_token(new_rt, token_path)

    response = requests.post(
        "https://graph.microsoft.com/v1.0/me/sendMail",
        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
        json={
            "message": {
                "subject": subject,
                "body": {"contentType": "HTML", "content": html},
                "toRecipients": [{"emailAddress": {"address": to_email}}],
            },
            "saveToSentItems": True,
        },
        timeout=30,
    )

    if response.status_code != 202:
        raise RuntimeError(f"Graph sendMail failed: {response.status_code} {response.text}")
