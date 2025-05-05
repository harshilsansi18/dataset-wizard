
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
import logging
from config import ServerConfig
import os
import re

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

@app.get("/validate-sql")
async def validate_sql(query: str):
    """Validate SQL query syntax"""
    try:
        # Enhanced SQL validation with more detailed errors
        logger.info(f"Validating SQL query: {query}")
        
        if not query or len(query) < 5:
            return {"valid": False, "message": "Query is too short"}
            
        # Check if query starts with SELECT
        if not query.lower().strip().startswith("select"):
            return {"valid": False, "message": "Only SELECT queries are allowed"}
        
        # Basic SQL syntax validation using regex patterns
        # Check for balanced parentheses
        if query.count('(') != query.count(')'):
            return {"valid": False, "message": "Unbalanced parentheses in query"}
        
        # Check for basic SQL structure
        if not re.search(r"select\s+.+\s+from\s+.+", query.lower()):
            return {"valid": False, "message": "Query must include both SELECT and FROM clauses"}
            
        # Detect common SQL syntax errors
        common_errors = [
            (r"where\s+and", "Found 'WHERE AND' - remove the extra AND"),
            (r"where\s+or", "Found 'WHERE OR' - remove the extra OR"),
            (r"from\s+from", "Duplicate FROM clause"),
            (r"select\s+select", "Duplicate SELECT clause"),
            (r"where\s+where", "Duplicate WHERE clause"),
            (r"from\s*$", "FROM clause cannot be at the end without a table name")
        ]
        
        for pattern, message in common_errors:
            if re.search(pattern, query.lower()):
                return {"valid": False, "message": message}
        
        # Check for IS NULL syntax
        null_check = re.search(r"(\w+)\s+is\s+null", query.lower())
        if null_check:
            column = null_check.group(1)
            return {
                "valid": True, 
                "message": f"Query checks if column '{column}' IS NULL",
                "operation": "null_check",
                "column": column
            }
            
        # Check for IS NOT NULL syntax
        not_null_check = re.search(r"(\w+)\s+is\s+not\s+null", query.lower())
        if not_null_check:
            column = not_null_check.group(1)
            return {
                "valid": True, 
                "message": f"Query checks if column '{column}' IS NOT NULL",
                "operation": "not_null_check",
                "column": column
            }
        
        # Check for IN clause
        in_clause = re.search(r"(\w+)\s+in\s+\(\s*(.*?)\s*\)", query.lower())
        if in_clause:
            column = in_clause.group(1)
            values = in_clause.group(2)
            return {
                "valid": True,
                "message": f"Query checks if column '{column}' is IN a list of values",
                "operation": "in_clause",
                "column": column,
                "values": values
            }
            
        return {"valid": True, "message": "Query appears to be valid"}
    except Exception as e:
        logger.error(f"SQL validation error: {str(e)}")
        return {"valid": False, "message": f"Error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server on {ServerConfig.HOST}:{ServerConfig.PORT}")
    uvicorn.run(
        "app:app", 
        host=ServerConfig.HOST,
        port=ServerConfig.PORT,
        reload=True
    )
