
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import date

class DatabaseConnection(BaseModel):
    """Model for database connection parameters"""
    host: str
    port: int
    database: str
    user: str
    password: Optional[str] = None

class TableImport(BaseModel):
    """Model for importing a table from a database"""
    host: str
    port: int
    database: str
    user: str
    table: str
    password: Optional[str] = None
    
class DatasetSource(BaseModel):
    """Source information for a dataset"""
    type: str
    connectionName: str
    tableName: str

class Dataset(BaseModel):
    """Model for a dataset"""
    id: str
    name: str
    type: str
    columnCount: int
    rowCount: int
    dateUploaded: str
    status: str
    size: str
    lastUpdated: str
    content: List[Dict[str, Any]]
    headers: List[str]
    isPublic: bool
    source: DatasetSource
    
class PublicDatasetEntry(BaseModel):
    """Model for storing a public dataset"""
    id: str
    dataset: Dict[str, Any]
