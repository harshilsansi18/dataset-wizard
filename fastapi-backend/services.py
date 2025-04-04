
import json
import os
import logging
from datetime import date
from database import get_db_connection
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("services")

# File to store public datasets
PUBLIC_DATASETS_FILE = "public_datasets.json"

def get_tables(connection_params: Dict[str, Any]) -> List[str]:
    """Get all tables in the database"""
    with get_db_connection(connection_params) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = [row["table_name"] for row in cursor]
        cursor.close()
        logger.info(f"Found {len(tables)} tables")
        return tables

def import_table_data(connection_params: Dict[str, Any], table_name: str) -> Dict[str, Any]:
    """Import table data as a dataset"""
    with get_db_connection(connection_params) as conn:
        cursor = conn.cursor()
        
        # Get column information
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = %s
        """, (table_name,))
        columns = cursor.fetchall()
        headers = [col["column_name"] for col in columns]
        
        # Get table data (limit to 1000 rows)
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 1000")
        rows = cursor.fetchall()
        
        # Convert to list of dictionaries (handle date objects)
        content = []
        for row in rows:
            row_dict = {}
            for key, value in row.items():
                if isinstance(value, date):
                    row_dict[key] = value.isoformat()
                else:
                    row_dict[key] = value
            content.append(row_dict)
        
        # Prepare the dataset response
        current_date = date.today().isoformat()
        dataset = {
            "id": f"db_{table_name}_{current_date}",
            "name": table_name,
            "type": "Database",
            "columnCount": len(headers),
            "rowCount": len(content),
            "dateUploaded": current_date,
            "status": "Not Validated",
            "size": f"{len(content) * len(headers) * 10} B",
            "lastUpdated": current_date,
            "content": content,
            "headers": headers,
            "isPublic": False,
            "source": {
                "type": "database",
                "connectionName": connection_params["database"],
                "tableName": table_name
            }
        }
        
        logger.info(f"Imported table {table_name} with {len(content)} rows and {len(headers)} columns")
        return dataset

def load_public_datasets() -> Dict[str, Any]:
    """Load public datasets from file"""
    try:
        if os.path.exists(PUBLIC_DATASETS_FILE):
            with open(PUBLIC_DATASETS_FILE, 'r') as f:
                return json.load(f)
        return {}
    except Exception as e:
        logger.error(f"Error loading public datasets: {str(e)}")
        return {}

def save_public_datasets(public_datasets: Dict[str, Any]) -> None:
    """Save public datasets to file"""
    try:
        with open(PUBLIC_DATASETS_FILE, 'w') as f:
            json.dump(public_datasets, f)
        logger.info(f"Saved {len(public_datasets)} public datasets")
    except Exception as e:
        logger.error(f"Error saving public datasets: {str(e)}")

def get_public_datasets() -> List[Dict[str, Any]]:
    """Get all public datasets"""
    public_datasets = load_public_datasets()
    return list(public_datasets.values())

def add_public_dataset(dataset_id: str, dataset: Dict[str, Any]) -> None:
    """Add a dataset to public datasets"""
    public_datasets = load_public_datasets()
    public_datasets[dataset_id] = dataset
    save_public_datasets(public_datasets)
    logger.info(f"Added dataset {dataset_id} to public datasets")

def remove_public_dataset(dataset_id: str) -> bool:
    """Remove a dataset from public datasets"""
    public_datasets = load_public_datasets()
    if dataset_id in public_datasets:
        del public_datasets[dataset_id]
        save_public_datasets(public_datasets)
        logger.info(f"Removed dataset {dataset_id} from public datasets")
        return True
    logger.warning(f"Dataset {dataset_id} not found in public datasets")
    return False
