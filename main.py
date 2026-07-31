from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import os
import platform
import psutil
import chromadb
from chromadb.utils import embedding_functions
import httpx
from bs4 import BeautifulSoup
import asyncio
import uuid

app = FastAPI(title="JARVIS OS Bridge - SuperBrain Edition", version="2.0.0")

# Enable CORS
origins = ["*"] # Flexible for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. Persistent Cognitive Memory (ChromaDB) ---
# Using a persistent client to save data to disk (optimized for 8GB RAM)
persist_directory = "./jarvis_memory"
chroma_client = chromadb.PersistentClient(path=persist_directory)
# Using a lightweight embedding function
default_ef = embedding_functions.DefaultEmbeddingFunction()
collection = chroma_client.get_or_create_collection(name="neural_memory", embedding_function=default_ef)

# --- 2. Task Tracking for Async Processing ---
tasks = {}

class CommandRequest(BaseModel):
    action: str
    params: dict = {}

class MemoryRequest(BaseModel):
    content: str
    metadata: dict = {}

# Security Whitelist
ALLOWED_ACTIONS = {
    "open_app": ["notepad", "calc", "explorer", "cmd", "taskmgr", "code"],
    "system_info": ["cpu", "memory", "disk", "battery"],
    "power_control": ["lock", "sleep"],
    "browser": ["open_url"]
}

@app.get("/health")
async def health_check():
    return {"status": "online", "memory_engine": "active", "research_engine": "ready"}

# --- Memory Endpoints ---
@app.post("/memory/store")
async def store_memory(request: MemoryRequest):
    mem_id = str(uuid.uuid4())
    collection.add(
        documents=[request.content],
        metadatas=[request.metadata],
        ids=[mem_id]
    )
    return {"status": "success", "id": mem_id}

@app.get("/memory/search")
async def search_memory(query: str, n_results: int = 3):
    results = collection.query(
        query_texts=[query],
        n_results=n_results
    )
    return {"status": "success", "results": results}

# --- Research Agent Logic ---
async def perform_research(task_id: str, query: str):
    tasks[task_id] = {"status": "processing", "progress": 10}
    try:
        # Step 1: Simulated Search (In a real app, use Serper or Google API)
        tasks[task_id]["progress"] = 30
        async with httpx.AsyncClient() as client:
            # Example: Scrape a placeholder for demo
            response = await client.get(f"https://www.google.com/search?q={query}")
            tasks[task_id]["progress"] = 60
            
            # Simple synthesis
            soup = BeautifulSoup(response.text, 'html.parser')
            text_content = soup.get_text()[:2000] # Limit for RAM
            
            tasks[task_id] = {
                "status": "completed",
                "progress": 100,
                "result": f"Research Synthesis for '{query}': {text_content[:500]}..."
            }
    except Exception as e:
        tasks[task_id] = {"status": "failed", "error": str(e)}

@app.post("/research")
async def start_research(query: str, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "queued", "progress": 0}
    background_tasks.add_task(perform_research, task_id, query)
    return {"task_id": task_id}

@app.get("/task/{task_id}")
async def get_task_status(task_id: str):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks[task_id]

# --- OS Control Endpoints ---
@app.post("/execute")
async def execute_command(request: CommandRequest):
    action = request.action
    params = request.params
    try:
        if action == "open_app":
            app_name = params.get("app_name", "").lower()
            if app_name in ALLOWED_ACTIONS["open_app"]:
                subprocess.Popen(app_name)
                return {"status": "success", "message": f"Opening {app_name}"}
        elif action == "system_info":
            mem = psutil.virtual_memory()
            return {"status": "success", "data": {"cpu": psutil.cpu_percent(), "ram": mem.percent}}
        
        # Power Control
        elif action == "power_control":
            cmd = params.get("cmd")
            if cmd == "lock" and platform.system() == "Windows":
                os.system("rundll32.exe user32.dll,LockWorkStation")
                return {"status": "success", "message": "System locked"}
                
        return {"status": "error", "message": "Action not permitted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
