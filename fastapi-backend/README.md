
# FastAPI PostgreSQL Backend

This is a FastAPI backend service that provides PostgreSQL database connectivity for the Data Quality Tool.

## Getting Started

### Prerequisites

- Python 3.7+ installed
- PostgreSQL database server running
- Basic knowledge of PostgreSQL

### Setup Instructions

#### 1. Environment Setup

First, create a virtual environment and install dependencies:

**Linux/macOS:**
```bash
# Make the start script executable
chmod +x start_backend.sh

# Run the start script
./start_backend.sh
```

**Windows:**
```cmd
# Run the start script
start_backend.bat
```

This will:
1. Create a Python virtual environment
2. Install required dependencies
3. Copy the `.env.example` file to `.env` if it doesn't exist
4. Start the FastAPI server

#### 2. Configure Database Connection

Edit the `.env` file with your PostgreSQL credentials:

```
POSTGRES_DEFAULT_HOST=localhost
POSTGRES_DEFAULT_PORT=5432
POSTGRES_DEFAULT_USER=postgres
POSTGRES_DEFAULT_PASSWORD=your_password
POSTGRES_DEFAULT_DATABASE=your_database
```

### API Endpoints

- **POST /connect**: Test database connection
- **GET /tables**: Get list of tables from database
- **POST /import**: Import table data as dataset
- **GET /public-datasets**: Get all public datasets
- **POST /public-datasets/{dataset_id}**: Add a dataset to public datasets
- **DELETE /public-datasets/{dataset_id}**: Remove a dataset from public datasets

### Troubleshooting

- **Connection Refused Error**: Make sure your PostgreSQL server is running and accessible
- **Authentication Error**: Check the username and password in your `.env` file
- **Database Not Found**: Ensure the database name is correct in your `.env` file
- **Port Already in Use**: Change the PORT value in `.env` if port 8000 is already in use

### Development

To manually start the server without the script:

```bash
# Activate virtual environment
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Start the server
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```
