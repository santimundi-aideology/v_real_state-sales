"""
Utility functions for agent operations.
"""


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
