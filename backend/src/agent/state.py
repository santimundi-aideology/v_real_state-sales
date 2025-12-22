from typing import Annotated, List, Literal, TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field


class RouteOutput(BaseModel):
    route: Literal["campaign", "route_2", "route_3"] = Field(description="The route to take based on the input")

class State(TypedDict):
    """
     Represents the state in the HR Agent Chatbot
    """
    messages: Annotated[List[BaseMessage], add_messages]
    route: str = Field(default="", description="The route to take based on the input")