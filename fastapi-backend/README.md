
# FastAPI PostgreSQL Backend for SODA Core

This directory contains the FastAPI backend service for connecting to PostgreSQL databases.

## Setup Instructions

1. Make sure you have Python installed (version 3.7+)

2. Install the required packages:
   ```bash
   pip install fastapi uvicorn psycopg2-binary
   ```

3. Create a file named `app.py` with the contents from `src/services/backendService.js`

4. Run the FastAPI application:
   ```bash
   uvicorn app:app --reload
   ```

5. The backend will be available at http://localhost:8000

## API Endpoints

- `POST /connect` - Test connection to database
- `GET /tables` - Get all tables in database
- `POST /import` - Import table as dataset

## Configuration

- By default, the server runs on port 8000
- Make sure to update the `API_URL` in `src/services/databaseService.ts` to match your backend URL
- In production, update the CORS settings to only allow requests from your frontend origin

## Security Considerations

- This is a development setup. For production, consider:
  - Adding proper authentication
  - Storing database credentials securely
  - Implementing connection pooling
  - Adding rate limiting
  - Setting up proper CORS headers
