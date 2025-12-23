"""LangGraph nodes for agent workflow execution."""

import logging
from langgraph.graph import END
from src.agent.state import State, RouteOutput, MessagesOutput, CustomersOutput, CampaignDetails
from src.agent.prompts import (
    ROUTE_INPUT_PROMPT, CAMPAIGN_PROMPT, EXTRACT_CUSTOMERS_PROMPT,
    GENERATE_MESSAGES_PROMPT, SEND_MESSAGES_PROMPT, EXTRACT_CAMPAIGN_DETAILS_PROMPT
)
from src.utils.logging import (
    log_node_entry, log_tool_calls, log_tool_messages,
    log_node_input, log_node_response, log_route_decision
)
from src.agent.utils import create_campaign_record, serialize_customer_data, get_last_tool_message
from langchain_core.messages import SystemMessage, HumanMessage
from src.agent.tools import get_db_tools, get_messaging_tools

logger = logging.getLogger(__name__)


def _extract_message_content(message) -> str:
    """Extract content from a message object."""
    return message.content if hasattr(message, 'content') else str(message)


class AgentNode:
    """Agent node handler for LangGraph workflow execution."""

    def __init__(self, llm, mcp_tools):
        """Initialize agent node with LLM and tools.

        Args:
            llm: Language model instance.
            mcp_tools: List of MCP tools.
        """
        self.llm = llm
        self.mcp_tools = mcp_tools
        self.db_tools = get_db_tools()
        self.messaging_tools = get_messaging_tools()

    def route_input(self, state: State) -> dict:
        """Route user input to appropriate workflow path.

        Args:
            state: Current graph state.

        Returns:
            Dictionary with route decision.
        """
        log_node_entry("route_input")
        user_input = state.get("user_input", "")
        log_node_input(user_input, "route_input")

        # Determine which workflow path to take based on user input
        llm_with_structured_output = self.llm.with_structured_output(RouteOutput)
        response = llm_with_structured_output.invoke([
            SystemMessage(content=ROUTE_INPUT_PROMPT),
            HumanMessage(content=user_input)
        ])

        log_route_decision(response.route)
        logger.info(f"Routing to {response.route} node")
        return {"route": response.route}

    def route_from_input(self, state: State):
        """Determine next node based on route decision.

        Args:
            state: Current graph state.

        Returns:
            Next node name or END.
        """
        route = state.get("route", "")
        return route if route in ["campaign", "route_2", "route_3"] else END



    def campaign_node(self, state: State) -> dict:
        """Query prospects matching campaign criteria.

        Args:
            state: Current graph state.

        Returns:
            Dictionary with AI response message.
        """
        log_node_entry("campaign_node")
        user_input = state.get("user_input", "")
        agent_persona = state.get("agent_persona", "Be formal, warm and polite")
        log_node_input(user_input, "campaign_node")

        context = "\n\n".join([
            f"## Agent Persona (REQUIRED - assume the persona and behaviour as follows and do not deviate from it):\n{agent_persona}",
            CAMPAIGN_PROMPT
        ])

        # Query prospects from database using SQL tools based on campaign criteria
        llm_with_tools = self.llm.bind_tools(self.mcp_tools + self.db_tools)
        response = llm_with_tools.invoke([
            SystemMessage(content=context),
            *state["messages"]
        ])

        log_node_response(response, "campaign_node")
        log_tool_calls(response, "campaign_node")
        if state.get("messages"):
            log_tool_messages(state["messages"], "campaign_node (existing tool responses)")

        return {"messages": [response]}

    
    def extract_customer_details_node(self, state: State) -> dict:
        """Extract customer data from prospect information using structured output.

        Args:
            state: Current graph state.

        Returns:
            Dictionary with extracted customer data.
        """
        log_node_entry("extract_customer_details_node")
        log_node_input("Extracting customer data from prospect information", "extract_customer_details_node")

        # Extract prospect data from the last tool message (SQL query result)
        last_tool_message = get_last_tool_message(state.get("messages", []))
        if not last_tool_message:
            logger.warning("No tool message found in state messages")
            return {}

        prospect_data = _extract_message_content(last_tool_message)
        logger.info(f"Using prospect data from last tool message (length: {len(prospect_data)} chars)")

        # Parse raw prospect data into structured CustomerData objects
        llm_with_structured_output = self.llm.with_structured_output(CustomersOutput, method="json_schema")
        response = llm_with_structured_output.invoke([
            SystemMessage(content=EXTRACT_CUSTOMERS_PROMPT),
            HumanMessage(content=prospect_data),
        ])

        logger.info(f"Extracted {len(response.customers)} customer(s) from prospect data")
        log_node_response(f"Extracted {len(response.customers)} customer(s)", "extract_customer_details_node")
        return {"customer_data": response.customers}

    
    def generate_messages_node(self, state: State) -> dict:
        """Generate English and Arabic campaign message templates.

        Args:
            state: Current graph state.

        Returns:
            Dictionary with generated message templates.
        """
        log_node_entry("generate_messages_node")
        user_input = state.get("user_input", "")
        agent_persona = state.get("agent_persona", "")

        context_parts = [f"Campaign details: {user_input}"]
        if agent_persona:
            context_parts.append(f"Agent persona: {agent_persona}")

        log_node_input("Generating messages for campaign", "generate_messages_node")

        # Generate message templates with {name} placeholders for both languages
        llm_with_structured_output = self.llm.with_structured_output(MessagesOutput)
        response = llm_with_structured_output.invoke([
            SystemMessage(content=GENERATE_MESSAGES_PROMPT),
            HumanMessage(content="\n".join(context_parts))
        ])

        generated_messages = {
            "english": response.english_message,
            "arabic": response.arabic_message
        }

        logger.info(f"Generated messages: English ({len(response.english_message)} chars), "
                   f"Arabic ({len(response.arabic_message)} chars)")
        log_node_response("Generated messages in both languages", "generate_messages_node")
        return {"generated_messages": generated_messages}

        

    def send_messages_node(self, state: State) -> dict:
        """Send personalized messages to customers via appropriate channels.

        Args:
            state: Current graph state.

        Returns:
            Dictionary with AI response message.
        """
        log_node_entry("send_messages_node")
        generated_messages = state.get("generated_messages", {})
        customer_data = state.get("customer_data", [])

        if not generated_messages or not customer_data:
            logger.warning("Missing generated messages or customer data")
            return {}

        messages_list = state.get("messages", [])
        if not messages_list:
            logger.warning("No messages in state")
            return {}

        campaign_content = _extract_message_content(messages_list[-1])
        logger.info(f"Using prospect data from campaign_node (length: {len(campaign_content)} chars)")
        logger.info(f"Personalizing messages for {len(customer_data)} customer(s)")

        human_parts = [
            "## Pre-generated Messages:",
            f"English: {generated_messages.get('english', '')}",
            f"Arabic: {generated_messages.get('arabic', '')}",
            "\n## Customer Data (for personalization):"
        ]
        human_parts.extend([
            f"- Name: {c.name}, Channel: {c.preferred_channel}, "
            f"Contact: {c.contact}, Language: {c.language}"
            for c in customer_data
        ])
        human_parts.extend(["\n## Prospect Data from Campaign:", campaign_content])

        # Send personalized messages via appropriate channels (email, WhatsApp, SMS)
        llm_with_tools = self.llm.bind_tools(self.messaging_tools)
        response = llm_with_tools.invoke([
            SystemMessage(content=SEND_MESSAGES_PROMPT),
            *state["messages"],
            HumanMessage(content="\n".join(human_parts)),
        ])

        log_node_response(response, "send_messages_node")
        log_tool_calls(response, "send_messages_node")
        return {"messages": [response]}

    
    def serialize_customer_data_node(self, state: State) -> dict:
        """Serialize customer data and create campaign record in database.

        Args:
            state: Current graph state.

        Returns:
            Dictionary with serialized customer data.
        """
        log_node_entry("serialize_customer_data_node")
        customer_data = state.get("customer_data", [])

        if not customer_data:
            logger.warning("No customer data available to serialize")
            return {}

        user_input = state.get("user_input", "")
        agent_persona = state.get("agent_persona", "Be formal, warm and polite")
        user_role = state.get("user_role", "system")

        # Extract campaign metadata from user input for database record
        llm_with_structured_output = self.llm.with_structured_output(CampaignDetails, method="json_schema")
        campaign_details = llm_with_structured_output.invoke([
            SystemMessage(content=EXTRACT_CAMPAIGN_DETAILS_PROMPT),
            HumanMessage(content=user_input),
        ])

        logger.info(f"Extracted campaign: {campaign_details.name}, "
                   f"city={campaign_details.target_city}, segment={campaign_details.target_segment}")

        # Serialize customer data for frontend display and database storage
        serialized_data, contacted_prospects = serialize_customer_data(customer_data)

        # Create campaign record in database with metrics and contacted prospects
        campaign_result = create_campaign_record(
            name=campaign_details.name,
            target_city=campaign_details.target_city,
            target_segment=campaign_details.target_segment,
            channels=campaign_details.channels,
            agent_persona=agent_persona,
            created_by=user_role,
            respect_dnc=campaign_details.respect_dnc,
            require_consent=campaign_details.require_consent,
            record_conversations=campaign_details.record_conversations,
            active_window_start=campaign_details.active_window_start,
            active_window_end=campaign_details.active_window_end,
            contacted_prospects=contacted_prospects,
        )

        if campaign_result.get('success'):
            logger.info(f"Campaign created: {campaign_result.get('campaign_name')} "
                       f"(ID: {campaign_result.get('campaign_id')})")
        else:
            logger.error(f"Failed to create campaign: {campaign_result.get('error')}")

        return {"serialized_customer_data": serialized_data}

        
    
    