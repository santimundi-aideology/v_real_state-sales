import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from src.mcp.supabase import get_mcp_tools_sync
from src.agent.graphbuilder import Agent_GraphBuilder
from src.agent.tools import get_db_tools, get_messaging_tools

# The code below is for LangGraph Studio
# Load environment variables from .env.local in the backend directory
backend_dir = Path(__file__).parent.parent
load_dotenv(backend_dir / ".env.local")

groq_api_key = os.getenv("GROQ_API_KEY")
claude_api_key = os.getenv("CLAUDE_API_KEY")
openai_api_key = os.getenv("OPENAI_API_KEY")

# Initialize LLM
#llm = ChatAnthropic(model="claude-sonnet-4-5-20250929", api_key=claude_api_key)
llm = ChatGroq(model="openai/gpt-oss-120b", api_key=groq_api_key)
#llm = ChatOpenAI(model="gpt-5", api_key=openai_api_key)

# Get all tools synchronously: MCP tools + database tools + messaging tools
mcp_tools = get_mcp_tools_sync()
db_tools = get_db_tools()
messaging_tools = get_messaging_tools()
all_tools = mcp_tools + db_tools + messaging_tools

# Build the graph
graph = Agent_GraphBuilder(llm=llm, mcp_tools=mcp_tools).build_graph()
