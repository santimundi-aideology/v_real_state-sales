"""
Custom tools for the agent to interact with Supabase database.
"""

import logging

from langchain_core.tools import tool
from src.mcp.supabase import get_supabase_client
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


def get_db_tools():
    return [list_prospects]