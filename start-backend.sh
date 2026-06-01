#!/bin/bash
# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Navigate to the backend directory
cd "$DIR/backend"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
else
    echo "Warning: venv directory not found in backend/. Running with system Python..."
fi

# Run the FastAPI app
echo "Starting backend server on http://localhost:8000 ..."
exec uvicorn main:app --reload --port 8000
