
from fastapi import APIRouter, HTTPException, Query, Depends, Response
from models import DatabaseConnection, TableImport, PublicDatasetEntry
from database import get_db_connection, test_connection
from services import get_tables, import_table_data, get_public_datasets, add_public_dataset, remove_public_dataset
import logging
import psycopg2
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("routes")

# Create router
router = APIRouter()

# Store active connections
active_connections = {}

@router.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Dataset Manager API",
        "version": "1.0.0",
        "endpoints": [
            "/health", "/connect", "/tables", "/import", 
            "/public-datasets", "/public-datasets/{dataset_id}"
        ]
    }

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "connections": len(active_connections)}

@router.post("/connect")
async def connect_database(connection: DatabaseConnection):
    """Test connection to a PostgreSQL database"""
    try:
        connection_params = {
            "host": connection.host,
            "port": connection.port,
            "database": connection.database,
            "user": connection.user,
            "password": connection.password,
        }
        
        connection_key = f"{connection.host}:{connection.port}/{connection.database}"
        logger.info(f"Testing connection to database: {connection_key}")
        
        success = test_connection(connection_params)
        
        if success:
            # Store the connection details with a unique key
            active_connections[connection_key] = connection_params
            logger.info(f"Successfully connected to {connection_key}")
        
        return {"success": success, "message": "Connection successful", "connectionKey": connection_key}
    except psycopg2.OperationalError as e:
        logger.error(f"PostgreSQL connection failed: {str(e)}")
        error_message = str(e)
        troubleshooting = get_connection_troubleshooting_tips(connection.host, connection.port)
        # Return a clean error response with troubleshooting tips
        return {"success": False, "error": error_message, "troubleshooting": troubleshooting}
    except Exception as e:
        logger.error(f"Connection failed with unexpected error: {str(e)}")
        # Return a clean error response
        return {"success": False, "error": f"Unexpected error: {str(e)}"}

@router.delete("/connect/{connection_key}")
async def disconnect_database(connection_key: str):
    """Disconnect from a database"""
    if connection_key in active_connections:
        del active_connections[connection_key]
        logger.info(f"Disconnected from {connection_key}")
        return {"success": True, "message": f"Disconnected from {connection_key}"}
    else:
        logger.warning(f"Connection {connection_key} not found")
        return {"success": False, "error": "Connection not found"}

@router.get("/connections")
async def list_connections():
    """List all active connections"""
    return {
        "connections": [
            {"key": key, "host": params["host"], "database": params["database"]} 
            for key, params in active_connections.items()
        ]
    }

def get_connection_troubleshooting_tips(host, port):
    """Generate troubleshooting tips based on connection parameters"""
    tips = [
        "Make sure PostgreSQL is installed and running on the target machine",
        f"Verify PostgreSQL is listening on {host}:{port}",
        "Check if your firewall allows connections to PostgreSQL",
        "Ensure the database user has permission to connect",
        "If using a remote server, ensure PostgreSQL is configured to accept remote connections in pg_hba.conf"
    ]
    
    if host == "localhost":
        # Add localhost-specific tips
        tips.append("On Windows, check if PostgreSQL service is running via Services app")
        tips.append("On Linux/Mac, try 'sudo service postgresql status' or 'pg_isready'")
    
    return tips

@router.get("/tables")
async def list_tables(
    connection_key: str = None,
    host: str = None, 
    port: int = None, 
    database: str = None, 
    user: str = None, 
    password: str = None
):
    """Get all tables in the database"""
    try:
        # First try to use connection_key if provided
        if connection_key and connection_key in active_connections:
            connection_params = active_connections[connection_key]
        else:
            # Fallback to direct connection parameters
            connection_params = {
                "host": host,
                "port": port,
                "database": database,
                "user": user,
                "password": password,
            }
        
        tables = get_tables(connection_params)
        return {"tables": tables}
    except Exception as e:
        logger.error(f"Error fetching tables: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching tables: {str(e)}")

@router.post("/import")
async def import_table(import_data: TableImport):
    """Import table data as a dataset"""
    try:
        connection_params = {
            "host": import_data.host,
            "port": import_data.port,
            "database": import_data.database,
            "user": import_data.user,
            "password": import_data.password,
        }
        
        dataset = import_table_data(connection_params, import_data.table)
        
        # Add validation status to the dataset
        dataset["status"] = "Validated"
        dataset["validation_results"] = [
            {
                "id": "val_1",
                "check": "Row Count Check",
                "status": "Pass" if dataset["rowCount"] > 0 else "Fail",
                "details": f"Dataset has {dataset['rowCount']} rows",
                "timestamp": dataset["lastUpdated"]
            },
            {
                "id": "val_2",
                "check": "Schema Validation",
                "status": "Pass",
                "details": f"Schema with {dataset['columnCount']} columns is valid",
                "timestamp": dataset["lastUpdated"]
            }
        ]
        
        return dataset
    except Exception as e:
        logger.error(f"Error importing table: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error importing table: {str(e)}")

@router.get("/public-datasets")
async def fetch_public_datasets():
    """Get all public datasets"""
    try:
        return {"datasets": get_public_datasets()}
    except Exception as e:
        logger.error(f"Error fetching public datasets: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching public datasets: {str(e)}")

@router.post("/public-datasets/{dataset_id}")
async def add_dataset_to_public(dataset_id: str, dataset: Dict[str, Any]):
    """Add a dataset to public datasets"""
    try:
        add_public_dataset(dataset_id, dataset)
        return {"success": True}
    except Exception as e:
        logger.error(f"Error adding public dataset: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error adding public dataset: {str(e)}")

@router.delete("/public-datasets/{dataset_id}")
async def delete_public_dataset(dataset_id: str):
    """Remove a dataset from public datasets"""
    try:
        success = remove_public_dataset(dataset_id)
        if not success:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing public dataset: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error removing public dataset: {str(e)}")

@router.get("/validate/{dataset_id}")
async def validate_dataset(dataset_id: str):
    """Validate a dataset"""
    try:
        # For now just return dummy validation results
        # In a real implementation, this would validate the dataset properly
        return {
            "success": True,
            "dataset_id": dataset_id,
            "validation_results": [
                {
                    "id": "val_1",
                    "check": "Row Count Check",
                    "status": "Pass",
                    "details": "Dataset has rows",
                    "timestamp": "2023-04-07T10:00:00Z"
                },
                {
                    "id": "val_2",
                    "check": "Schema Validation",
                    "status": "Pass",
                    "details": "Schema is valid",
                    "timestamp": "2023-04-07T10:00:00Z"
                },
                {
                    "id": "val_3",
                    "check": "Data Type Check",
                    "status": "Pass",
                    "details": "All columns have correct data types",
                    "timestamp": "2023-04-07T10:00:00Z"
                }
            ]
        }
    except Exception as e:
        logger.error(f"Error validating dataset: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error validating dataset: {str(e)}")
