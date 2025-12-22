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


class CustomersOutput(BaseModel):
    """List of customer data extracted from prospects."""
    customers: List[CustomerData] = Field(description="List of customer data extracted from prospect rows")


class MessagesOutput(BaseModel):
    """Generated messages in both languages."""
    english_message: str = Field(description="Campaign message in English")
    arabic_message: str = Field(description="Campaign message in Arabic (equivalent translation)")


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