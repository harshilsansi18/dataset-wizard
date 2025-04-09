from fastapi import APIRouter, HTTPException, Query, Depends, Response
from models import DatabaseConnection, TableImport, PublicDatasetEntry
from database import get_db_connection, test_connection
from services import get_tables, import_table_data, get_public_datasets, add_public_dataset, remove_public_dataset
import logging
import psycopg2

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("routes")

# Create router
router = APIRouter()

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
        
        logger.info(f"Testing connection to database: {connection.host}:{connection.port}/{connection.database}")
        success = test_connection(connection_params)
        return {"success": success, "message": "Connection successful"}
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
    host: str, 
    port: int, 
    database: str, 
    user: str, 
    password: str = None
):
    """Get all tables in the database"""
    try:
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
async def add_dataset_to_public(dataset_id: str, dataset: dict):
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
