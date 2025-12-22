import logging
from langgraph.graph import END
from src.agent.state import State, RouteOutput
from src.agent.prompts import ROUTE_INPUT_PROMPT, CAMPAIGN_PROMPT
from src.agent.logging_utils import (
    log_node_entry,
    log_tool_calls,
    log_tool_messages,
    log_node_input,
    log_node_response,
    log_route_decision,
)
from src.agent.tools import get_db_tools
from langchain_core.messages import SystemMessage, HumanMessage

logger = logging.getLogger(__name__)


class AgentNode:

    def __init__(self, llm, tools):
        self.llm = llm
        self.tools = tools
        self.llm_with_tools = self.llm.bind_tools(self.tools)

    def route_input(self, state: State):
        log_node_entry("route_input")
        
        user_input = state["messages"][-1].content
        log_node_input(user_input, "route_input")

        llm_with_structured_output = self.llm.with_structured_output(RouteOutput)

        messages = [
            SystemMessage(content=ROUTE_INPUT_PROMPT),
            HumanMessage(content=user_input)
        ]

        response = llm_with_structured_output.invoke(messages)
        
        log_route_decision(response.route)
        logger.info(f"Routing to {response.route} node")

        return {"route": response.route}



    def route_from_input(self, state: State):
        route = state.get("route", "")
        
        if route == "campaign":
            return "campaign"
        elif route == "route_2":
            return "route_2"
        elif route == "route_3":
            return "route_3"
        else:
            return END



    def campaign_node(self, state: State):
        log_node_entry("campaign_node")
        
        user_input = state["messages"][-1].content
        log_node_input(user_input, "campaign_node")

        messages = [
            SystemMessage(content=CAMPAIGN_PROMPT),
            *state["messages"],
            HumanMessage(content=user_input)
        ]
        
        # Combine MCP tools with database tools
        all_tools = self.tools + get_db_tools()
        llm_with_tools = self.llm.bind_tools(all_tools)


        response = llm_with_tools.invoke(messages)
        
        log_node_response(response, "campaign_node")
        log_tool_calls(response, "campaign_node")
        
        # Log existing tool messages if any
        if state.get("messages"):
            log_tool_messages(state["messages"], "campaign_node (existing tool responses)")

        return {"messages": [response]}