
# FastAPI PostgreSQL Backend

This directory contains a FastAPI backend service for connecting to PostgreSQL databases.

## Setup Instructions

1. Make sure you have Python installed (version 3.7+)

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the FastAPI application:
   ```bash
   uvicorn app:app --reload
   ```

5. The backend will be available at http://localhost:8000

## API Endpoints

- `POST /connect` - Test connection to database
- `GET /tables` - Get all tables in database
- `POST /import` - Import table as dataset
- `GET /public-datasets` - Get all public datasets
- `POST /public-datasets/{dataset_id}` - Add a dataset to public datasets
- `DELETE /public-datasets/{dataset_id}` - Remove a dataset from public datasets

## Configuration

- By default, the server runs on port 8000
- Make sure your PostgreSQL server is running and accessible

## Troubleshooting

- If you get a "Connection refused" error, make sure your PostgreSQL server is running
- Check that the hostname, port, database name, username, and password are correct
- For local development, try using "localhost" as the hostname
- If using a remote PostgreSQL server, ensure that remote connections are allowed in pg_hba.conf

## Security Considerations

- This is a development setup. For production, consider:
  - Adding proper authentication
  - Storing database credentials securely
  - Implementing connection pooling
  - Adding rate limiting
  - Setting up proper CORS headers
