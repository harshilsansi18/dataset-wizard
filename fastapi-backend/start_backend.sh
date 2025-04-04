
#!/bin/bash

# Make this script executable with: chmod +x start_backend.sh
# Then run with: ./start_backend.sh

echo "Starting FastAPI backend server..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is required but not installed."
    exit 1
fi

# Check if virtual environment exists, if not create it
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv || { echo "ERROR: Failed to create virtual environment"; exit 1; }
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate || { echo "ERROR: Failed to activate virtual environment"; exit 1; }

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt || { echo "ERROR: Failed to install dependencies"; exit 1; }

# Check if .env file exists, if not create it from .env.example
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please update the .env file with your PostgreSQL credentials"
fi

# Start the server
echo "Starting FastAPI server..."
echo "API will be available at http://localhost:8000"
uvicorn app:app --reload --host 0.0.0.0 --port 8000
