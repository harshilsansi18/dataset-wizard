
from fastapi import FastAPI, HTTPException, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from datetime import date
import uvicorn

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change to your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DatabaseConnection(BaseModel):
    host: str
    port: int
    database: str
    user: str
    password: str = None

class TableImport(BaseModel):
    host: str
    port: int
    database: str
    user: str
    table: str
    password: str = None

@app.post("/connect")
def test_connection(connection: DatabaseConnection):
    try:
        conn = psycopg2.connect(
            host=connection.host,
            port=connection.port,
            database=connection.database,
            user=connection.user,
            password=connection.password,
            sslmode='require'
        )
        conn.close()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection error: {str(e)}")

@app.get("/tables")
def get_tables(
    host: str, 
    port: int, 
    database: str, 
    user: str, 
    password: str = None
):
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password,
            sslmode='require'
        )
        cursor = conn.cursor()
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = [row[0] for row in cursor.fetchall()]
        cursor.close()
        conn.close()
        return {"tables": tables}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tables: {str(e)}")

@app.post("/import")
def import_table(import_data: TableImport):
    try:
        conn = psycopg2.connect(
            host=import_data.host,
            port=import_data.port,
            database=import_data.database,
            user=import_data.user,
            password=import_data.password,
            sslmode='require'
        )
        cursor = conn.cursor()
        
        # Get column information
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = %s
        """, (import_data.table,))
        columns = cursor.fetchall()
        headers = [col[0] for col in columns]
        
        # Get data (limit to 1000 rows)
        cursor.execute(f"SELECT * FROM {import_data.table} LIMIT 1000")
        rows = cursor.fetchall()
        
        # Convert to list of dictionaries
        content = []
        for row in rows:
            row_dict = {}
            for i, header in enumerate(headers):
                # Handle date conversions and other special types
                if isinstance(row[i], date):
                    row_dict[header] = row[i].isoformat()
                else:
                    row_dict[header] = row[i]
            content.append(row_dict)
        
        cursor.close()
        conn.close()
        
        # Prepare the dataset response
        dataset = {
            "id": f"db_{import_data.table}_{date.today().isoformat()}",
            "name": import_data.table,
            "type": "Database",
            "columnCount": len(headers),
            "rowCount": len(content),
            "dateUploaded": date.today().isoformat(),
            "status": "Not Validated",
            "size": f"{len(content) * len(headers) * 10} B",
            "lastUpdated": date.today().isoformat(),
            "content": content,
            "headers": headers,
            "isPublic": False,
            "source": {
                "type": "database",
                "connectionName": import_data.database,
                "tableName": import_data.table
            }
        }
        
        return dataset
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing table: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
