import logging
from langgraph.graph import END
from src.agent.state import State, RouteOutput, MessagesOutput, CustomerData, CustomersOutput, CampaignDetails
from src.agent.prompts import ROUTE_INPUT_PROMPT, CAMPAIGN_PROMPT, EXTRACT_CUSTOMERS_PROMPT, GENERATE_MESSAGES_PROMPT, SEND_MESSAGES_PROMPT, EXTRACT_CAMPAIGN_DETAILS_PROMPT
from src.utils.logging import (
    log_node_entry,
    log_tool_calls,
    log_tool_messages,
    log_node_input,
    log_node_response,
    log_route_decision,
)
from src.agent.utils import create_campaign_record, serialize_customer_data, get_last_tool_message
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from src.agent.tools import get_db_tools, get_messaging_tools

logger = logging.getLogger(__name__)


class AgentNode:

    def __init__(self, llm, mcp_tools):
        self.llm = llm
        self.mcp_tools = mcp_tools
        self.db_tools = get_db_tools()
        self.messaging_tools = get_messaging_tools()

        

    def route_input(self, state: State):
        log_node_entry("route_input")
        
        user_input = state.get("user_input", "")
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
        
        user_input = state.get("user_input", "")
        agent_persona = state.get("agent_persona", "Be formal, warm and polite")
        user_role = state.get("user_role")  # Always provided by frontend
        log_node_input(user_input, "campaign_node")

        # Build prompt with agent persona and user role context
        prompt_content = CAMPAIGN_PROMPT
        context_parts = []
        
        # Agent persona is always provided (default set in app.py)
        context_parts.append(f"## Agent Persona (REQUIRED - use this value for agent_persona field):\n{agent_persona}")
        logger.info(f"Agent persona: {agent_persona[:100]}...")
        
        # User role is always provided
        context_parts.append(f"## User Role (use this for created_by field):\n{user_role}")
        logger.info(f"User role: {user_role}")
        
        if context_parts:
            prompt_content = "\n\n".join(context_parts) + "\n\n" + CAMPAIGN_PROMPT

        messages = [
            SystemMessage(content=prompt_content),
            *state["messages"]
        ]
        
        llm_with_tools = self.llm.bind_tools(self.mcp_tools + self.db_tools)
        response = llm_with_tools.invoke(messages)
        
        log_node_response(response, "campaign_node")
        log_tool_calls(response, "campaign_node")
        
        # Log existing tool messages if any
        if state.get("messages"):
            log_tool_messages(state["messages"], "campaign_node (existing tool responses)")

        return {"messages": [response]}

    
    def extract_customer_details_node(self, state: State):
        """Extract customer data from prospect information using structured output."""
        log_node_entry("extract_customer_details_node")
        
        log_node_input("Extracting customer data from prospect information", "extract_customer_details_node")
        
        
        # Use helper function to get the last tool message
        last_tool_message = get_last_tool_message(state.get("messages", []))
        
        if not last_tool_message:
            logger.warning("No tool message found in state messages")
            return {}
        
        # Extract the content from the last tool message (prospect data)
        prospect_data_content = ""
        if hasattr(last_tool_message, 'content'):
            prospect_data_content = last_tool_message.content
        else:
            prospect_data_content = str(last_tool_message)
        
        logger.info(f"Using prospect data from last tool message (length: {len(prospect_data_content)} chars)")
        
        llm_with_structured_output = self.llm.with_structured_output(CustomersOutput, method="json_schema")
        
        messages = [
            SystemMessage(content=EXTRACT_CUSTOMERS_PROMPT),
            HumanMessage(content=prospect_data_content),  # Only the prospect data, not all messages
        ]
        
        response = llm_with_structured_output.invoke(messages)
        
        customer_data = response.customers
        
        logger.info(f"Extracted {len(customer_data)} customer(s) from prospect data")
        log_node_response(f"Extracted {len(customer_data)} customer(s)", "extract_customer_details_node")
        
        return {"customer_data": customer_data}

    
    def generate_messages_node(self, state: State):
        """Generate English and Arabic campaign messages upfront."""
       
        log_node_entry("generate_messages_node")
        
        user_input = state.get("user_input", "")
        agent_persona = state.get("agent_persona", "")
        
        # Build context for message generation
        context_parts = [f"Campaign details: {user_input}"]
        if agent_persona:
            context_parts.append(f"Agent persona: {agent_persona}")
        
        context = "\n".join(context_parts)
        
        log_node_input(f"Generating messages for campaign", "generate_messages_node")
        
        llm_with_structured_output = self.llm.with_structured_output(MessagesOutput)
        
        messages = [
            SystemMessage(content=GENERATE_MESSAGES_PROMPT),
            HumanMessage(content=context)
        ]
        
        response = llm_with_structured_output.invoke(messages)
        
        # Store messages in state as a dictionary
        generated_messages = {
            "english": response.english_message,
            "arabic": response.arabic_message
        }
        
        # Log the English message
        logger.info("Generated English message:")
        logger.info(response.english_message)
        
        logger.info(f"Generated messages: English ({len(response.english_message)} chars), Arabic ({len(response.arabic_message)} chars)")
        log_node_response(f"Generated messages in both languages", "generate_messages_node")
        
        return {"generated_messages": generated_messages}

        

    def send_messages_node(self, state: State):
        """Send messages to customers via appropriate channels."""
        log_node_entry("send_messages_node")
        
        generated_messages = state.get("generated_messages", {})
        customer_data = state.get("customer_data", [])
        
        if not generated_messages:
            logger.warning("No generated messages available")
            return {}
        
        if not customer_data:
            logger.warning("No customer data available for personalization")
            return {}
        
        # Get the last message from state['messages'] - this should be from campaign_node
        # Since extract_customer_details_node and generate_messages_node use structured output,
        # they don't add messages, so the last message is from campaign_node
        messages_list = state.get("messages", [])
        if not messages_list:
            logger.warning("No messages in state - cannot get prospect data")
            return {}
        
        # The last message should be from campaign_node with prospect data
        last_message = messages_list[-1]
        campaign_message_content = ""
        
        if hasattr(last_message, 'content'):
            campaign_message_content = last_message.content
        else:
            campaign_message_content = str(last_message)
        
        logger.info(f"Using prospect data from campaign_node message (length: {len(campaign_message_content)} chars)")
        logger.info(f"Personalizing messages for {len(customer_data)} customer(s)")
        
        
        # Build SystemMessage with instructions
        system_content = SEND_MESSAGES_PROMPT
        
        # Build HumanMessage with data (pre-generated messages, customer data, and prospect data)
        human_content_parts = []
        
        if generated_messages:
            human_content_parts.append("## Pre-generated Messages:")
            human_content_parts.append(f"English: {generated_messages.get('english', '')}")
            human_content_parts.append(f"Arabic: {generated_messages.get('arabic', '')}")
        
        # Include customer data for personalization
        human_content_parts.append("\n## Customer Data (for personalization):")
        for customer in customer_data:
            human_content_parts.append(f"- Name: {customer.name}, Channel: {customer.preferred_channel}, Contact: {customer.contact}, Language: {customer.language}")
        
        # Include the prospect data from campaign_node message
        human_content_parts.append("\n## Prospect Data from Campaign:")
        human_content_parts.append(campaign_message_content)
        
        human_content = "\n".join(human_content_parts)
        
        messages = [
            SystemMessage(content=system_content),
            *state["messages"],
            HumanMessage(content=human_content),
        ]
        
        llm_with_tools = self.llm.bind_tools(self.messaging_tools)
        response = llm_with_tools.invoke(messages)
        
        log_node_response(response, "send_messages_node")
        log_tool_calls(response, "send_messages_node")
        
        return {"messages": [response]}

    
    def serialize_customer_data_node(self, state: State):
        """Serialize customer data to JSON format for frontend display and create campaign record."""
        log_node_entry("serialize_customer_data_node")
        
        customer_data = state.get("customer_data", [])
        
        if not customer_data:
            logger.warning("No customer data available to serialize")
            return {}
        
        # Extract campaign details from user_input
        user_input = state.get("user_input", "")
        agent_persona = state.get("agent_persona", "Be formal, warm and polite")
        user_role = state.get("user_role", "system")
        
        logger.info("Extracting campaign details from user input")
        
        # Use structured output to extract campaign details
        llm_with_structured_output = self.llm.with_structured_output(CampaignDetails, method="json_schema")
        
        messages = [
            SystemMessage(content=EXTRACT_CAMPAIGN_DETAILS_PROMPT),
            HumanMessage(content=user_input),
        ]
        
        campaign_details = llm_with_structured_output.invoke(messages)
        
        logger.info(f"Extracted campaign details: name={campaign_details.name}, city={campaign_details.target_city}, segment={campaign_details.target_segment}")
        
        # Serialize CustomerData list to JSON-serializable format using helper function
        serialized_data, contacted_prospects = serialize_customer_data(customer_data)
        
        # Create campaign record in database
        logger.info("Creating campaign record in database")
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
            logger.info(f"Campaign created successfully: {campaign_result.get('campaign_name')} (ID: {campaign_result.get('campaign_id')})")
        else:
            logger.error(f"Failed to create campaign: {campaign_result.get('error')}")
        
        # Store serialized data in state for the API to return
        return {"serialized_customer_data": serialized_data}

        
    
    