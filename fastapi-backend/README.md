
# FastAPI PostgreSQL Backend

This directory contains a FastAPI backend service for connecting to PostgreSQL databases.

## Project Structure

```
fastapi-backend/
├── app.py           # Main FastAPI application entry point
├── config.py        # Configuration management (environment variables)
├── database.py      # Database connection handling
├── models.py        # Pydantic data models
├── routes.py        # API endpoints
├── services.py      # Business logic
├── requirements.txt # Python dependencies
└── .env.example     # Example environment variables
```

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

4. Create a .env file from the template:
   ```bash
   cp .env.example .env
   ```

5. Edit the .env file with your PostgreSQL connection details

6. Run the FastAPI application:
   ```bash
   python app.py
   # Or alternatively:
   # uvicorn app:app --reload
   ```

7. The backend will be available at http://localhost:8000
   - API documentation is available at http://localhost:8000/docs

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /connect` - Test connection to database
- `GET /tables` - Get all tables in database
- `POST /import` - Import table as dataset
- `GET /public-datasets` - Get all public datasets
- `POST /public-datasets/{dataset_id}` - Add a dataset to public datasets
- `DELETE /public-datasets/{dataset_id}` - Remove a dataset from public datasets

## Configuration

- Default configuration uses environment variables from the .env file
- Server runs on host/port specified in .env (defaults to 0.0.0.0:8000)

## Troubleshooting

- If you get a "Connection refused" error, make sure your PostgreSQL server is running
- Check that the hostname, port, database name, username, and password are correct
- For local development, try using "localhost" as the hostname
- If using a remote PostgreSQL server, ensure that remote connections are allowed
- Check PostgreSQL logs for connection errors
- Make sure the database user has proper privileges

## Security Considerations

- This is a development setup. For production, consider:
  - Adding proper authentication with JWT or OAuth2
  - Implementing rate limiting
  - Setting up proper CORS headers
  - Using HTTPS
  - Implementing database connection pooling
  - Storing sensitive credentials securely
