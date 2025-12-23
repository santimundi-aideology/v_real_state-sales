from langgraph.graph import START, StateGraph, END
from langgraph.prebuilt import ToolNode, tools_condition
from src.agent.state import State
from src.agent.nodes import AgentNode
from src.agent.tools import get_db_tools, get_messaging_tools


class Agent_GraphBuilder:
    """
    This class builds the graph used to execute agent queries based on the user's query.
    """

    def __init__(self, llm, mcp_tools):
        self.llm = llm
        self.mcp_tools = mcp_tools
        self.graph = StateGraph(State)

        

    def build_graph(self):
        """
        Builds the graph used to execute agent queries based on the user's query.
        """
        # Combine MCP tools with custom database tools and messaging tools for ToolNode


        # Initialize the agent node
        agent_node = AgentNode(self.llm, self.mcp_tools)

        all_tools = self.mcp_tools + get_db_tools() + get_messaging_tools()
                
        # Create ToolNode with all tools (MCP + database + messaging) and handle_tool_errors=True
        tool_node = ToolNode(all_tools, handle_tool_errors=True)

        # Add the nodes to the graph
        self.graph.add_node("route_input", agent_node.route_input)
        self.graph.add_node("campaign", agent_node.campaign_node)
        self.graph.add_node("extract_customers", agent_node.extract_customer_details_node)
        self.graph.add_node("generate_messages", agent_node.generate_messages_node)
        self.graph.add_node("send_messages", agent_node.send_messages_node)
        self.graph.add_node("serialize_customer_data", agent_node.serialize_customer_data_node)
        self.graph.add_node("tools_campaign", tool_node)
        self.graph.add_node("tools_send_messages", tool_node)

        # Start with routing
        self.graph.add_edge(START, "route_input")
        
        # Route based on the route determined by route_input
        self.graph.add_conditional_edges(
            "route_input",
            agent_node.route_from_input,
            {
                "campaign": "campaign",
                "route_2": END,  # Placeholder for future routes
                "route_3": END,  # Placeholder for future routes
            }
        )

        # After campaign_node runs, check if tools are needed
        self.graph.add_conditional_edges(
            "campaign",
            tools_condition,
            {
                "tools": "tools_campaign",
                END: "extract_customers",  # After tools, extract customer details
            }
        )

        # After tools execute, return to campaign_node
        self.graph.add_edge("tools_campaign", "campaign")
        
        # After extracting customers, generate messages
        self.graph.add_edge("extract_customers", "generate_messages")
        
        # After generating messages, send messages
        self.graph.add_edge("generate_messages", "send_messages")

        # After send_messages_node runs, check if tools are needed
        self.graph.add_conditional_edges(
            "send_messages",
            tools_condition,
            {
                "tools": "tools_send_messages",
                END: "serialize_customer_data",  # After tools, serialize customer data
            }
        )

        # After tools execute, return to send_messages_node
        self.graph.add_edge("tools_send_messages", "send_messages")
        
        # After serializing customer data, end the graph
        self.graph.add_edge("serialize_customer_data", END)
        
        return self.graph.compile()


