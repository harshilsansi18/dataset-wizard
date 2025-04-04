
@echo off
echo Starting FastAPI backend server...

REM Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Python is required but not installed.
    exit /b 1
)

REM Check if virtual environment exists, if not create it
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to create virtual environment
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to activate virtual environment
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install dependencies
    exit /b 1
)

REM Check if .env file exists, if not create it from .env.example
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo Please update the .env file with your PostgreSQL credentials
)

REM Start the server
echo Starting FastAPI server...
echo API will be available at http://localhost:8000
uvicorn app:app --reload --host 0.0.0.0 --port 8000
