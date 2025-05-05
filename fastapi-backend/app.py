
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
        
        # Extract selected columns
        select_match = re.search(r"select\s+(.*?)\s+from", query.lower())
        selected_columns = []
        if select_match:
            cols = select_match.group(1).split(',')
            selected_columns = [col.strip() for col in cols]
            if "*" in selected_columns:
                selected_columns = ["all columns"]
        
        # Extract table name
        from_match = re.search(r"from\s+(\w+)", query.lower())
        table_name = from_match.group(1) if from_match else "unknown"
                
        # Check for IS NULL syntax
        null_check = re.search(r"(\w+)\s+is\s+null", query.lower())
        if null_check:
            column = null_check.group(1)
            return {
                "valid": True, 
                "message": f"Query would return {', '.join(selected_columns)} from {table_name} where {column} IS NULL",
                "operation": "null_check",
                "column": column,
                "selected_columns": selected_columns,
                "table": table_name
            }
            
        # Check for IS NOT NULL syntax
        not_null_check = re.search(r"(\w+)\s+is\s+not\s+null", query.lower())
        if not_null_check:
            column = not_null_check.group(1)
            return {
                "valid": True, 
                "message": f"Query would return {', '.join(selected_columns)} from {table_name} where {column} IS NOT NULL",
                "operation": "not_null_check",
                "column": column,
                "selected_columns": selected_columns,
                "table": table_name
            }
        
        # Check for IN clause
        in_clause = re.search(r"(\w+)\s+in\s+\(\s*(.*?)\s*\)", query.lower())
        if in_clause:
            column = in_clause.group(1)
            values = in_clause.group(2)
            values_list = re.findall(r"'([^']*)'|([^',\s]+)", values)
            parsed_values = [v[0] if v[0] else v[1] for v in values_list]
            
            return {
                "valid": True,
                "message": f"Query would return {', '.join(selected_columns)} from {table_name} where {column} is in ({', '.join(parsed_values)})",
                "operation": "in_clause",
                "column": column,
                "values": parsed_values,
                "selected_columns": selected_columns,
                "table": table_name
            }
            
        # Check for column comparison
        comparison_match = re.search(r"(\w+)\s*(=|!=|>|<|>=|<=)\s*(['\w]+)", query.lower())
        if comparison_match:
            column = comparison_match.group(1)
            operator = comparison_match.group(2)
            value = comparison_match.group(3).strip("'")
            
            return {
                "valid": True,
                "message": f"Query would return {', '.join(selected_columns)} from {table_name} where {column} {operator} {value}",
                "operation": "comparison",
                "column": column,
                "operator": operator,
                "value": value,
                "selected_columns": selected_columns,
                "table": table_name
            }
            
        return {
            "valid": True, 
            "message": f"Query would select {', '.join(selected_columns)} from {table_name}",
            "selected_columns": selected_columns,
            "table": table_name
        }
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
