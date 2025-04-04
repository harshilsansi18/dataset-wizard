
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
import logging
from config import PostgresConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database")

@contextmanager
def get_db_connection(connection_params=None):
    """
    Context manager for database connections.
    Uses default connection params from PostgresConfig if none are provided.
    """
    # Use provided connection params or defaults from config
    if connection_params is None:
        connection_params = {
            "host": PostgresConfig.HOST,
            "port": PostgresConfig.PORT,
            "database": PostgresConfig.DATABASE,
            "user": PostgresConfig.USER,
            "password": PostgresConfig.PASSWORD,
        }
        
    try:
        # Connect to the PostgreSQL database
        logger.info(f"Connecting to database: {connection_params['host']}:{connection_params['port']}/{connection_params['database']}")
        
        conn = psycopg2.connect(
            **connection_params,
            cursor_factory=RealDictCursor
        )
        logger.info("Database connection established")
        yield conn
        
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise
        
    finally:
        if 'conn' in locals() and conn is not None:
            conn.close()
            logger.info("Database connection closed")

def test_connection(connection_params):
    """Test if we can connect to the database with given parameters"""
    try:
        with get_db_connection(connection_params) as conn:
            # Just connecting is enough for testing
            return True
    except Exception as e:
        logger.error(f"Connection test failed: {str(e)}")
        raise
