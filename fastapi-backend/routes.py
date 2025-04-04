
from fastapi import APIRouter, HTTPException, Query, Depends
from models import DatabaseConnection, TableImport, PublicDatasetEntry
from database import get_db_connection, test_connection
from services import get_tables, import_table_data, get_public_datasets, add_public_dataset, remove_public_dataset
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("routes")

# Create router
router = APIRouter()

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
        
        success = test_connection(connection_params)
        return {"success": success}
    except Exception as e:
        logger.error(f"Connection failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Connection error: {str(e)}")

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
