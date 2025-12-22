import logging
from langgraph.graph import END
from src.agent.state import State, RouteOutput, MessagesOutput, CustomerData, CustomersOutput
from src.agent.prompts import ROUTE_INPUT_PROMPT, CAMPAIGN_PROMPT, EXTRACT_CUSTOMERS_PROMPT, GENERATE_MESSAGES_PROMPT, SEND_MESSAGES_PROMPT
from src.utils.logging import (
    log_node_entry,
    log_tool_calls,
    log_tool_messages,
    log_node_input,
    log_node_response,
    log_route_decision,
)
from src.agent.tools import get_db_tools, get_messaging_tools
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage

logger = logging.getLogger(__name__)


class AgentNode:

    def __init__(self, llm, tools):
        self.llm = llm
        self.tools = tools
        self.llm_with_tools = self.llm.bind_tools(self.tools)

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
        
        response = self.llm_with_tools.invoke(messages)
        
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
        
        # Get the last message from campaign_node (should contain prospect data)
        # Filter out tool messages and only use the final AI response
        messages_list = state.get("messages", [])
        if not messages_list:
            logger.warning("No messages in state - cannot extract customer data")
            return {}
        
        # Find the last AI message (from campaign_node) - skip tool messages
        last_ai_message = None
        for msg in reversed(messages_list):
            if isinstance(msg, AIMessage) and not isinstance(msg, ToolMessage):
                last_ai_message = msg
                break
        
        if not last_ai_message:
            logger.warning("No AI message found in state messages")
            return {}
        
        # Extract the content from the last AI message (prospect data)
        prospect_data_content = ""
        if hasattr(last_ai_message, 'content'):
            prospect_data_content = last_ai_message.content
        else:
            prospect_data_content = str(last_ai_message)
        
        logger.info(f"Using prospect data from campaign_node (length: {len(prospect_data_content)} chars)")
        
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
        
        if not generated_messages:
            logger.warning("No generated messages available")
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
        
        
        # Build SystemMessage with instructions
        system_content = SEND_MESSAGES_PROMPT
        
        # Build HumanMessage with data (pre-generated messages and prospect data)
        human_content_parts = []
        
        if generated_messages:
            human_content_parts.append("## Pre-generated Messages:")
            human_content_parts.append(f"English: {generated_messages.get('english', '')}")
            human_content_parts.append(f"Arabic: {generated_messages.get('arabic', '')}")
        
        # Include the prospect data from campaign_node message
        human_content_parts.append("\n## Prospect Data from Campaign:")
        human_content_parts.append(campaign_message_content)
        
        human_content = "\n".join(human_content_parts)
        
        messages = [
            SystemMessage(content=system_content),
            HumanMessage(content=human_content),
        ]
        
        response = self.llm_with_tools.invoke(messages)
        
        log_node_response(response, "send_messages_node")
        log_tool_calls(response, "send_messages_node")
        
        return {"messages": [response]}

    
    def serialize_customer_data_node(self, state: State):
        """Serialize customer data to JSON format for frontend display."""
        log_node_entry("serialize_customer_data_node")
        
        customer_data = state.get("customer_data", [])
        
        if not customer_data:
            logger.warning("No customer data available to serialize")
            return {}
        
        # Serialize CustomerData list to JSON-serializable format
        serialized_data = []
        for customer in customer_data:
            customer_dict = {
                "name": customer.name,
                "preferred_channel": customer.preferred_channel,
                "contact": customer.contact,
                "language": customer.language,
                "city": customer.city,
                "primary_segment": customer.primary_segment,
                "budget_max": customer.budget_max,
                "property_type_pref": customer.property_type_pref,
            }
            serialized_data.append(customer_dict)
        
        logger.info(f"Serialized {len(serialized_data)} customer(s) to JSON format")
        
        # Store serialized data in state for the API to return
        return {"serialized_customer_data": serialized_data}

        
    
    