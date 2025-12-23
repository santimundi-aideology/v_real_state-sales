from typing import Annotated, List, Literal, TypedDict, Dict, Optional
from typing_extensions import NotRequired
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field


class RouteOutput(BaseModel):
    route: Literal["campaign", "route_2", "route_3"] = Field(description="The route to take based on the input")


class CustomerData(BaseModel):
    """Customer data extracted from prospect information."""
    name: str = Field(description="Customer's full name")
    preferred_channel: Literal["call", "whatsapp", "email"] = Field(description="Preferred communication channel")
    contact: str = Field(description="Contact information (phone for call/whatsapp, email for email)")
    language: Literal["english", "arabic"] = Field(description="Preferred language")
    city: Optional[str] = Field(default=None, description="City location (riyadh, jeddah)")
    primary_segment: Optional[str] = Field(default=None, description="Primary segment (hnw, investor, first_time)")
    budget_max: Optional[float] = Field(default=None, description="Maximum budget")
    property_type_pref: Optional[str] = Field(default=None, description="Preferred property type")
    dnc: Optional[bool] = Field(default=None, description="Do Not Call status (True if on DNC list, False or None if not)")
    consent_status: Optional[str] = Field(default=None, description="Consent status (opted_in, opted_out, unknown)")


class CustomersOutput(BaseModel):
    """List of customer data extracted from prospects."""
    customers: List[CustomerData] = Field(description="List of customer data extracted from prospect rows")


class MessagesOutput(BaseModel):
    """Generated message templates in both languages with {name} placeholders."""
    english_message: str = Field(description="Campaign message template in English with {name} placeholder")
    arabic_message: str = Field(description="Campaign message template in Arabic (equivalent translation) with {name} placeholder")


class CampaignDetails(BaseModel):
    """Campaign details extracted from user input."""
    name: str = Field(description="Campaign name")
    target_city: Literal["riyadh", "jeddah", "all"] = Field(description="Target city")
    target_segment: Literal["hnw", "investor", "first_time", "all"] = Field(description="Target segment")
    channels: List[Literal["call", "sms", "whatsapp", "email"]] = Field(description="Communication channels")
    respect_dnc: bool = Field(default=True, description="Respect DNC list")
    require_consent: bool = Field(default=True, description="Require consent")
    record_conversations: bool = Field(default=True, description="Record conversations")
    active_window_start: Optional[str] = Field(default=None, description="Active window start time (HH:MM:SS)")
    active_window_end: Optional[str] = Field(default=None, description="Active window end time (HH:MM:SS)")


class State(TypedDict):
    """
     Represents the state in the Agentic Sales OS.
    """
    messages: Annotated[List[BaseMessage], add_messages]
    user_input: str
    route: NotRequired[str]
    agent_persona: NotRequired[str]
    user_role: NotRequired[str]  # User role (admin, sales_manager, etc.) for created_by field
    customer_data: NotRequired[List[CustomerData]]  # Extracted customer data
    generated_messages: NotRequired[Dict[str, str]]  # {'english': '...', 'arabic': '...'}
    serialized_customer_data: NotRequired[List[Dict]]  # JSON-serializable customer data for frontend