"""LangGraph builder for agent workflow."""

from langgraph.graph import START, StateGraph, END
from langgraph.prebuilt import ToolNode, tools_condition
from src.agent.state import State
from src.agent.nodes import AgentNode
from src.agent.tools import get_db_tools, get_messaging_tools


class Agent_GraphBuilder:
    """Builds and compiles LangGraph workflow for agent execution."""

    def __init__(self, llm, mcp_tools):
        """Initialize graph builder.

        Args:
            llm: Language model instance.
            mcp_tools: List of MCP tools.
        """
        self.llm = llm
        self.mcp_tools = mcp_tools
        self.graph = StateGraph(State)

        

    def build_graph(self):
        """Build and compile the agent workflow graph.

        Returns:
            Compiled LangGraph ready for execution.
        """
        agent_node = AgentNode(self.llm, self.mcp_tools)
        
        # Combine all tools (MCP, DB, messaging) for tool execution nodes
        all_tools = self.mcp_tools + get_db_tools() + get_messaging_tools()
        tool_node = ToolNode(all_tools, handle_tool_errors=True)

        # Add workflow nodes
        self.graph.add_node("route_input", agent_node.route_input)
        self.graph.add_node("campaign", agent_node.campaign_node)
        self.graph.add_node("extract_customers", agent_node.extract_customer_details_node)
        self.graph.add_node("generate_messages", agent_node.generate_messages_node)
        self.graph.add_node("send_messages", agent_node.send_messages_node)
        self.graph.add_node("serialize_customer_data", agent_node.serialize_customer_data_node)
        self.graph.add_node("tools_campaign", tool_node)  # Execute tools for campaign node
        self.graph.add_node("tools_send_messages", tool_node)  # Execute tools for send_messages node

        # Define workflow edges: START -> route_input -> campaign -> extract -> generate -> send -> serialize -> END
        self.graph.add_edge(START, "route_input")
        self.graph.add_conditional_edges(
            "route_input",
            agent_node.route_from_input,
            {"campaign": "campaign", "route_2": END, "route_3": END}
        )
        # Campaign node can loop back to tools if LLM calls tools, otherwise proceed to extract
        self.graph.add_conditional_edges(
            "campaign",
            tools_condition,
            {"tools": "tools_campaign", END: "extract_customers"}
        )
        self.graph.add_edge("tools_campaign", "campaign")  # Loop back after tool execution
        self.graph.add_edge("extract_customers", "generate_messages")
        self.graph.add_edge("generate_messages", "send_messages")
        # Send messages node can loop back to tools if LLM calls tools, otherwise proceed to serialize
        self.graph.add_conditional_edges(
            "send_messages",
            tools_condition,
            {"tools": "tools_send_messages", END: "serialize_customer_data"}
        )
        self.graph.add_edge("tools_send_messages", "send_messages")  # Loop back after tool execution
        self.graph.add_edge("serialize_customer_data", END)

        return self.graph.compile()
