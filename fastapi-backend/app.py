
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
import logging
from config import ServerConfig
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("app")

app = FastAPI(
    title="Dataset Manager API",
    description="API for managing datasets and database connections",
    version="1.0.0"
)

# Enable CORS with proper configuration for GitHub Codespaces
origins = [
    "http://localhost:5173",            # Vite default
    "http://localhost:8080",            # Alternative Vite port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
]

# Adding GitHub Codespaces URLs if running in that environment
if "GITHUB_CODESPACES" in os.environ or "CODESPACE_NAME" in os.environ:
    # Add wildcard for GitHub Codespaces domains
    origins.append("https://*.app.github.dev")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.app\.github\.dev",  # Regex for GitHub Codespaces
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(router)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server on {ServerConfig.HOST}:{ServerConfig.PORT}")
    uvicorn.run(
        "app:app", 
        host=ServerConfig.HOST,
        port=ServerConfig.PORT,
        reload=True
    )
