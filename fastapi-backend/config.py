
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database configuration with defaults
class PostgresConfig:
    HOST = os.getenv("POSTGRES_DEFAULT_HOST", "localhost")
    PORT = int(os.getenv("POSTGRES_DEFAULT_PORT", "5432"))
    USER = os.getenv("POSTGRES_DEFAULT_USER", "postgres")
    PASSWORD = os.getenv("POSTGRES_DEFAULT_PASSWORD", "")
    DATABASE = os.getenv("POSTGRES_DEFAULT_DATABASE", "postgres")

# Server configuration
class ServerConfig:
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))

# Logging configuration
class LogConfig:
    LEVEL = os.getenv("LOG_LEVEL", "INFO")
    FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
