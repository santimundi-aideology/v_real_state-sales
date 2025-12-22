"""
Logging configuration for the Agent backend.

This module sets up structured logging with:
- Daily log folders (YYYY-MM-DD format)
- Separate log files for different levels (app.log, errors.log)
- Files overwritten on each app run (for dev purposes)
- Timestamps and module names in log messages
"""

import logging
import os
from datetime import datetime
from pathlib import Path
from logging.handlers import RotatingFileHandler


def setup_logging(log_dir: str = None) -> None:
    """
    Configure logging for the application.
    
    Creates daily log folders and sets up file handlers for:
    - app.log: All logs (INFO and above)
    - errors.log: Only ERROR and CRITICAL logs
    
    Args:
        log_dir: Base directory for logs. If None, defaults to ../../logs from this file
    """
    # Determine log directory - 2 levels up from this file (backend/logs/)
    if log_dir is None:
        # This file is at backend/src/agent/logging_config.py
        # So ../../logs from here is backend/logs/
        current_file = Path(__file__)
        log_dir = str(current_file.parent.parent.parent / "logs")
    
    # Create base logs directory if it doesn't exist
    base_log_path = Path(log_dir)
    base_log_path.mkdir(exist_ok=True)
    
    # Create today's date folder (YYYY-MM-DD format)
    today = datetime.now().strftime("%Y-%m-%d")
    daily_log_path = base_log_path / today
    daily_log_path.mkdir(exist_ok=True)
    
    # Set up log file paths
    app_log_file = daily_log_path / "app.log"
    errors_log_file = daily_log_path / "errors.log"
    
    # For dev: delete existing log files to ensure overwrite (not append)
    if app_log_file.exists():
        app_log_file.unlink()
    if errors_log_file.exists():
        errors_log_file.unlink()
    
    # Define log format
    log_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)  # Capture all levels at root
    
    # Remove existing handlers to avoid duplicates
    root_logger.handlers.clear()
    
    # Handler 1: App log (INFO and above) - overwrite mode for dev
    app_handler = RotatingFileHandler(
        app_log_file,
        mode='w',  # Write mode (overwrite) - for dev purposes
        maxBytes=10 * 1024 * 1024,  # 10MB per file
        backupCount=5,  # Keep 5 backup files
        encoding='utf-8'
    )
    app_handler.setLevel(logging.INFO)
    app_handler.setFormatter(log_format)
    app_handler.addFilter(lambda record: record.levelno >= logging.INFO)
    root_logger.addHandler(app_handler)
    
    # Handler 2: Errors log (ERROR and CRITICAL only) - overwrite mode for dev
    errors_handler = RotatingFileHandler(
        errors_log_file,
        mode='w',  # Write mode (overwrite) - for dev purposes
        maxBytes=10 * 1024 * 1024,  # 10MB per file
        backupCount=5,  # Keep 5 backup files
        encoding='utf-8'
    )
    errors_handler.setLevel(logging.ERROR)
    errors_handler.setFormatter(log_format)
    root_logger.addHandler(errors_handler)
    
    # Disable console/stdout logging for our application logs only
    # Remove any existing StreamHandlers (console handlers) from root logger
    for handler in root_logger.handlers[:]:
        if isinstance(handler, logging.StreamHandler) and not isinstance(handler, RotatingFileHandler):
            root_logger.removeHandler(handler)
    
    # Allow uvicorn's startup/shutdown messages to show in console
    # But disable uvicorn access logs (HTTP request logs) to reduce noise
    uvicorn_access_logger = logging.getLogger("uvicorn.access")
    uvicorn_access_logger.handlers.clear()
    uvicorn_access_logger.propagate = False
    
    # Log the setup using root logger to ensure it goes to file handlers
    separator = "=" * 80
    root_logger.info(separator)
    root_logger.info(f"NEW EXECUTION RUN - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    root_logger.info(separator)
    root_logger.info(f"Logging configured. Logs directory: {daily_log_path.absolute()}")
    root_logger.info(f"App logs: {app_log_file}")
    root_logger.info(f"Error logs: {errors_log_file}")
    
    # Flush handlers to ensure separator is written immediately
    for handler in root_logger.handlers:
        handler.flush()

