import os
import logging
import uvicorn
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv

# Set up logging FIRST, before any other imports that might use logging
from src.utils.logging import setup_logging
setup_logging()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage

# MCP helpers
from src.mcp.supabase import init_mcp, shutdown_mcp, get_mcp_tools

# Agent graph builder
from src.agent.graphbuilder import Agent_GraphBuilder

# Load environment variables from .env.local in the same directory as app.py
load_dotenv(Path(__file__).parent / ".env.local")

logger = logging.getLogger(__name__)


groq_llm = ChatGroq(
   model="openai/gpt-oss-120b",
   api_key=os.getenv("GROQ_API_KEY"),
)

# -----------------------------
# App lifecycle (lifespan context manager)
# -----------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI app lifecycle.
    
    Startup (before yield):
    - Open ONE persistent MCP session to Supabase MCP (fast tool calls)
    - Load MCP tools bound to that session
    - Build the LangGraph graph ONCE and cache it
    
    This avoids:
    - Rebuilding the graph on every /query request
    - Re-discovering tools repeatedly
    - Opening/closing MCP sessions repeatedly per tool call
    
    Shutdown (after yield):
    - Close the persistent MCP session
    """
    # Startup: Initialize MCP and build graph
    await init_mcp()
    mcp_tools = await get_mcp_tools()
    
    logger.info(f"MCP tools loaded and cached: {[tool.name for tool in mcp_tools]}")
    
    # Build the graph once and cache it
    app.state.agent_graph = Agent_GraphBuilder(llm=groq_llm, mcp_tools=mcp_tools).build_graph()
    logger.info("Agent graph built and cached")

    yield  # App runs here
    
    # Shutdown: Cleanup MCP session
    try:
        await shutdown_mcp()
    except Exception as e:
        # Suppress shutdown errors - these are cleanup issues and don't affect functionality
        logger.warning(f"Non-critical error during MCP shutdown: {type(e).__name__}: {e}")

# -----------------------------
# FastAPI app setup
# -----------------------------
app = FastAPI(lifespan=lifespan)

# Allow your Next.js frontend (localhost:3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# API endpoint
# -----------------------------
@app.post("/query")
async def query(request: Request):
    """
    Main endpoint called by the frontend.

    Per request:
    - Read query from request
    - Reuse the cached graph (built at startup)
    - Invoke graph asynchronously (required for async MCP tools)
    """
    data = await request.json()

    query_text = data.get("query", "")
    agent_persona = data.get("agent_persona", "") or "Be formal, warm and polite"  # Use default if empty or missing
    user_role = data.get("user_role")  # Always provided by frontend
    
    logger.info(f"Received query request: {query_text[:100]}...")
    if agent_persona:
        logger.info(f"Agent persona provided: {agent_persona[:100]}...")
    logger.info(f"User role: {user_role}")
    
    # Get the cached graph
    graph = app.state.agent_graph
    
    # Invoke graph with state
    result = await graph.ainvoke(
        {
            "messages": [HumanMessage(content=query_text)],
            "user_input": query_text,
            "agent_persona": agent_persona,
            "user_role": user_role,
        }
    )
    
    # Extract message content from result
    message_content = ""
    if result.get("messages"):
        last_message = result["messages"][-1]
        if hasattr(last_message, "content"):
            message_content = last_message.content
        else:
            message_content = str(last_message)
    
    # Log the full response
    logger.info("=" * 80)
    logger.info("FULL LLM RESPONSE:")
    logger.info("=" * 80)
    logger.info(message_content)
    logger.info("=" * 80)
    
    # Check if we have serialized customer data to return to frontend
    serialized_customer_data = result.get("serialized_customer_data")
    
    if serialized_customer_data:
        logger.info(f"Returning serialized customer data for {len(serialized_customer_data)} customer(s)")
        # Return JSON response with both message and customer data
        return JSONResponse({
            "message": message_content,
            "customer_data": serialized_customer_data
        })
    
    # Return the response content as JSON for consistency (backward compatible)
    return JSONResponse({"message": message_content})

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"ok": True}

# -----------------------------
# Local dev entrypoint
# -----------------------------
if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=False
    )

