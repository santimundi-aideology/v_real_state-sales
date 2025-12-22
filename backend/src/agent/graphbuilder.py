from langgraph.graph import START, StateGraph, END
from langgraph.prebuilt import ToolNode, tools_condition
from src.agent.state import State
from src.agent.nodes import AgentNode


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
        
        # Initialize the agent node
        agent_node = AgentNode(self.llm, self.mcp_tools)

        # Create ToolNode with handle_tool_errors=True to convert exceptions to tool messages
        tool_node = ToolNode(self.mcp_tools, handle_tool_errors=True)

        # Add the nodes to the graph
        self.graph.add_node("route_input", agent_node.route_input)
        self.graph.add_node("campaign", agent_node.campaign_node)
        self.graph.add_node("tools", tool_node)

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
                "tools": "tools",
                END: END,
            }
        )

        # After tools execute, return to campaign_node
        self.graph.add_edge("tools", "campaign")

        
        return self.graph.compile()


