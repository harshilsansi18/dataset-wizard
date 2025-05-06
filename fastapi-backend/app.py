
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
import logging
from config import ServerConfig
import os
import re
import pandas as pd
from datetime import datetime
import email_validator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("app")

app = FastAPI(
    title="Dataset Manager API",
    description="API for managing datasets and database connections",
    version="1.0.0"
)

# Enable CORS with proper configuration for GitHub Codespaces
origins = [
    "http://localhost:5173",            # Vite default
    "http://localhost:8080",            # Alternative Vite port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    "*",                                # Allow all origins temporarily for debugging
]

# Adding GitHub Codespaces URLs if running in that environment
if "GITHUB_CODESPACES" in os.environ or "CODESPACE_NAME" in os.environ:
    # Add wildcard for GitHub Codespaces domains
    origins.append("https://*.app.github.dev")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.app\.github\.dev",  # Regex for GitHub Codespaces
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(router)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.get("/validate-sql")
async def validate_sql(query: str):
    """Validate SQL query syntax and return detailed information about the operation"""
    try:
        # Enhanced SQL validation with more detailed errors
        logger.info(f"Validating SQL query: {query}")
        
        if not query or len(query) < 5:
            return {"valid": False, "message": "Query is too short"}
            
        # Check if query starts with SELECT
        if not query.lower().strip().startswith("select"):
            return {"valid": False, "message": "Only SELECT queries are allowed"}
        
        # Basic SQL syntax validation using regex patterns
        # Check for balanced parentheses
        if query.count('(') != query.count(')'):
            return {"valid": False, "message": "Unbalanced parentheses in query"}
        
        # Check for basic SQL structure
        if not re.search(r"select\s+.+\s+from\s+.+", query.lower()):
            return {"valid": False, "message": "Query must include both SELECT and FROM clauses"}
            
        # Detect common SQL syntax errors
        common_errors = [
            (r"where\s+and", "Found 'WHERE AND' - remove the extra AND"),
            (r"where\s+or", "Found 'WHERE OR' - remove the extra OR"),
            (r"from\s+from", "Duplicate FROM clause"),
            (r"select\s+select", "Duplicate SELECT clause"),
            (r"where\s+where", "Duplicate WHERE clause"),
            (r"from\s*$", "FROM clause cannot be at the end without a table name"),
            (r";.*\S", "Extra characters after semicolon")
        ]
        
        for pattern, message in common_errors:
            if re.search(pattern, query.lower()):
                return {"valid": False, "message": message}
        
        # Extract selected columns
        select_match = re.search(r"select\s+(.*?)\s+from", query.lower(), re.DOTALL)
        selected_columns = []
        if select_match:
            cols = select_match.group(1).split(',')
            selected_columns = [col.strip() for col in cols]
            if "*" in selected_columns:
                selected_columns = ["all columns"]
        
        # Extract table name
        from_match = re.search(r"from\s+(\w+)", query.lower())
        table_name = from_match.group(1) if from_match else "unknown"
        
        # Check if query has a semicolon at the end and remove anything after it for further processing
        clean_query = query.split(';')[0].strip()
                
        # Check for IS NULL syntax
        null_check = re.search(r"(\w+)\s+is\s+null", clean_query.lower())
        if null_check:
            column = null_check.group(1)
            return {
                "valid": True, 
                "message": f"Query would return {', '.join(selected_columns)} from {table_name} where {column} IS NULL",
                "operation": "null_check",
                "column": column,
                "selected_columns": selected_columns,
                "table": table_name,
                "query_type": "filter",
                "rows_affected": "rows where column value is NULL"
            }
            
        # Check for IS NOT NULL syntax
        not_null_check = re.search(r"(\w+)\s+is\s+not\s+null", clean_query.lower())
        if not_null_check:
            column = not_null_check.group(1)
            return {
                "valid": True, 
                "message": f"Query would return {', '.join(selected_columns)} from {table_name} where {column} IS NOT NULL",
                "operation": "not_null_check",
                "column": column,
                "selected_columns": selected_columns,
                "table": table_name,
                "query_type": "filter",
                "rows_affected": "rows where column value is not NULL"
            }
        
        # Check for IN clause
        in_clause = re.search(r"(\w+)\s+in\s+\(\s*(.*?)\s*\)", clean_query.lower())
        if in_clause:
            column = in_clause.group(1)
            values = in_clause.group(2)
            values_list = re.findall(r"'([^']*)'|([^',\s]+)", values)
            parsed_values = [v[0] if v[0] else v[1] for v in values_list]
            
            return {
                "valid": True,
                "message": f"Query would return {', '.join(selected_columns)} from {table_name} where {column} is in ({', '.join(parsed_values)})",
                "operation": "in_clause",
                "column": column,
                "values": parsed_values,
                "selected_columns": selected_columns,
                "table": table_name,
                "query_type": "filter",
                "rows_affected": f"rows where {column} matches any of these values: {', '.join(parsed_values)}"
            }
            
        # Check for column comparison
        comparison_match = re.search(r"(\w+)\s*(=|!=|>|<|>=|<=)\s*(['\w]+)", clean_query.lower())
        if comparison_match:
            column = comparison_match.group(1)
            operator = comparison_match.group(2)
            value = comparison_match.group(3).strip("'")
            
            return {
                "valid": True,
                "message": f"Query would return {', '.join(selected_columns)} from {table_name} where {column} {operator} {value}",
                "operation": "comparison",
                "column": column,
                "operator": operator,
                "value": value,
                "selected_columns": selected_columns,
                "table": table_name,
                "query_type": "filter",
                "rows_affected": f"rows where {column} {operator} {value}"
            }
            
        return {
            "valid": True, 
            "message": f"Query would select {', '.join(selected_columns)} from {table_name}",
            "selected_columns": selected_columns,
            "table": table_name,
            "query_type": "select",
            "rows_affected": "all rows in table"
        }
    except Exception as e:
        logger.error(f"SQL validation error: {str(e)}")
        return {"valid": False, "message": f"Error: {str(e)}"}

@app.post("/extended-validation")
async def extended_validation(data: dict):
    """Perform extended validation checks on dataset"""
    try:
        validation_type = data.get("validationType", "basic")
        dataset_content = data.get("content", [])
        headers = data.get("headers", [])
        
        if not dataset_content or not headers:
            return {"success": False, "message": "No data provided for validation"}
        
        # Convert to DataFrame for easier processing
        df = pd.DataFrame(dataset_content)
        results = []
        
        # Perform validations based on type
        if validation_type == "format_checks":
            # Check name fields for proper format (uppercase)
            name_fields = [col for col in headers if any(x in col.lower() for x in ["name", "first", "last", "suffix"])]
            for field in name_fields:
                if field in df.columns:
                    uppercase_check = all(str(x).isupper() for x in df[field] if x and pd.notna(x))
                    results.append({
                        "check": f"Format check for {field}",
                        "status": "Pass" if uppercase_check else "Fail",
                        "details": f"All values in {field} are uppercase" if uppercase_check else f"Some values in {field} are not uppercase"
                    })
            
            # Check date fields format (YYYY/MM/DD)
            date_fields = [col for col in headers if any(x in col.lower() for x in ["date", "dob", "birth"])]
            for field in date_fields:
                if field in df.columns:
                    date_format_valid = True
                    invalid_dates = []
                    
                    for val in df[field]:
                        if val and pd.notna(val):
                            try:
                                # Check if date format is YYYY/MM/DD or similar
                                if not re.match(r"^\d{4}[/\-]\d{1,2}[/\-]\d{1,2}$", str(val)):
                                    date_format_valid = False
                                    invalid_dates.append(str(val))
                            except:
                                date_format_valid = False
                                invalid_dates.append(str(val))
                    
                    sample = invalid_dates[:3]
                    results.append({
                        "check": f"Date format check for {field}",
                        "status": "Pass" if date_format_valid else "Fail",
                        "details": f"All dates in {field} follow YYYY/MM/DD format" if date_format_valid 
                                else f"Invalid date formats found: {', '.join(sample)}{'...' if len(invalid_dates) > 3 else ''}"
                    })
                    
            # Check email fields (lowercase and valid format)
            email_fields = [col for col in headers if "email" in col.lower()]
            for field in email_fields:
                if field in df.columns:
                    email_format_valid = True
                    invalid_emails = []
                    
                    for val in df[field]:
                        if val and pd.notna(val):
                            try:
                                email_validator.validate_email(val)
                                if val != val.lower():
                                    email_format_valid = False
                                    invalid_emails.append(f"{val} (not lowercase)")
                            except:
                                email_format_valid = False
                                invalid_emails.append(f"{val} (invalid format)")
                    
                    sample = invalid_emails[:3]
                    results.append({
                        "check": f"Email format check for {field}",
                        "status": "Pass" if email_format_valid else "Fail",
                        "details": f"All emails in {field} are valid and lowercase" if email_format_valid 
                                else f"Invalid emails found: {', '.join(sample)}{'...' if len(invalid_emails) > 3 else ''}"
                    })
                    
        elif validation_type == "value_lookup":
            # Check gender fields for valid values (F or M)
            gender_fields = [col for col in headers if "gender" in col.lower()]
            for field in gender_fields:
                if field in df.columns:
                    valid_values = ["F", "M"]
                    all_valid = all(str(x).upper() in valid_values for x in df[field] if x and pd.notna(x))
                    invalid_values = [str(x) for x in df[field] if x and pd.notna(x) and str(x).upper() not in valid_values]
                    sample = invalid_values[:3]
                    
                    results.append({
                        "check": f"Gender field check for {field}",
                        "status": "Pass" if all_valid else "Fail",
                        "details": f"All values in {field} are valid (F or M)" if all_valid 
                                else f"Invalid gender values found: {', '.join(sample)}{'...' if len(invalid_values) > 3 else ''}"
                    })
                    
            # Check civil status fields (S or M)
            status_fields = [col for col in headers if any(x in col.lower() for x in ["civil", "marital", "status"])]
            for field in status_fields:
                if field in df.columns:
                    valid_values = ["S", "M"]
                    all_valid = all(str(x).upper() in valid_values for x in df[field] if x and pd.notna(x))
                    invalid_values = [str(x) for x in df[field] if x and pd.notna(x) and str(x).upper() not in valid_values]
                    sample = invalid_values[:3]
                    
                    results.append({
                        "check": f"Civil status check for {field}",
                        "status": "Pass" if all_valid else "Fail",
                        "details": f"All values in {field} are valid (S or M)" if all_valid 
                                else f"Invalid status values found: {', '.join(sample)}{'...' if len(invalid_values) > 3 else ''}"
                    })
                    
        elif validation_type == "data_completeness":
            # Row count check
            row_count = len(df)
            results.append({
                "check": "Row count check",
                "status": "Pass" if row_count > 0 else "Fail",
                "details": f"Dataset has {row_count} rows"
            })
            
            # Missing field checks for required fields
            # Assuming all fields are required unless specified otherwise
            for field in headers:
                null_count = df[field].isna().sum() if field in df.columns else row_count
                null_percent = (null_count / row_count) * 100 if row_count > 0 else 0
                
                results.append({
                    "check": f"Missing field check for {field}",
                    "status": "Pass" if null_count == 0 else "Warning" if null_percent < 5 else "Fail",
                    "details": f"No missing values in {field}" if null_count == 0 
                            else f"{null_count} missing values ({null_percent:.1f}%) in {field}"
                })
                
            # Duplicate check for identity fields
            id_fields = [col for col in headers if any(x in col.lower() for x in ["id", "key", "identity"])]
            if id_fields:
                for field in id_fields:
                    if field in df.columns:
                        duplicate_count = len(df) - df[field].nunique()
                        duplicates = []
                        
                        if duplicate_count > 0:
                            value_counts = df[field].value_counts()
                            dupes = value_counts[value_counts > 1]
                            duplicates = dupes.index.tolist()[:3]  # Get top 3 duplicated values
                            
                        results.append({
                            "check": f"Duplicate check for {field}",
                            "status": "Pass" if duplicate_count == 0 else "Fail",
                            "details": f"No duplicates in {field}" if duplicate_count == 0
                                    else f"Found {duplicate_count} duplicates in {field}. Examples: {duplicates}"
                        })
                        
        elif validation_type == "data_quality":
            # Date field quality checks
            date_fields = [col for col in headers if any(x in col.lower() for x in ["date", "dob", "birth"])]
            for field in date_fields:
                if field in df.columns:
                    has_year_1800 = False
                    future_dates = False
                    invalid_dates = []
                    
                    for val in df[field]:
                        if val and pd.notna(val):
                            try:
                                date_val = pd.to_datetime(val)
                                year = date_val.year
                                if year < 1900:
                                    has_year_1800 = True
                                    invalid_dates.append(f"{val} (year < 1900)")
                                if date_val > datetime.now():
                                    future_dates = True
                                    invalid_dates.append(f"{val} (future date)")
                            except:
                                pass
                    
                    sample = invalid_dates[:3]
                    results.append({
                        "check": f"Date quality check for {field}",
                        "status": "Pass" if not has_year_1800 and not future_dates else "Fail",
                        "details": f"All dates in {field} are within acceptable limits" if not has_year_1800 and not future_dates
                                else f"Issues with dates: {', '.join(sample)}{'...' if len(invalid_dates) > 3 else ''}"
                    })
            
            # Numeric field quality checks
            numeric_fields = [col for col in headers if df[col].dtype.kind in 'ifc']  # integer, float, complex
            for field in numeric_fields:
                if field in df.columns:
                    try:
                        # Check for outliers using IQR
                        q1 = df[field].quantile(0.25)
                        q3 = df[field].quantile(0.75)
                        iqr = q3 - q1
                        lower_bound = q1 - 1.5 * iqr
                        upper_bound = q3 + 1.5 * iqr
                        
                        outliers = df[(df[field] < lower_bound) | (df[field] > upper_bound)][field]
                        outlier_count = len(outliers)
                        outlier_percent = (outlier_count / len(df)) * 100
                        
                        results.append({
                            "check": f"Numeric quality check for {field}",
                            "status": "Pass" if outlier_count == 0 else "Warning" if outlier_percent < 5 else "Fail",
                            "details": f"No outliers in {field}" if outlier_count == 0
                                    else f"Found {outlier_count} outliers ({outlier_percent:.1f}%) in {field}"
                        })
                    except:
                        results.append({
                            "check": f"Numeric quality check for {field}",
                            "status": "Warning",
                            "details": f"Could not analyze {field} for numeric quality"
                        })
        
        # Return validation results with timestamp
        return {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "validation_type": validation_type,
            "results": results
        }
                
    except Exception as e:
        logger.error(f"Extended validation error: {str(e)}")
        import traceback
        return {
            "success": False, 
            "message": f"Validation error: {str(e)}",
            "traceback": traceback.format_exc()
        }

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server on {ServerConfig.HOST}:{ServerConfig.PORT}")
    uvicorn.run(
        "app:app", 
        host=ServerConfig.HOST,
        port=ServerConfig.PORT,
        reload=True
    )
