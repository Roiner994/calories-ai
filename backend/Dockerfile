# =============================================================================
# VisionMacro Backend — Dockerfile
# =============================================================================
# Multi-stage build for a slim production image.
# Run:  docker build -t visionmacro-api .
#       docker run -p 8000:8000 --env-file .env visionmacro-api
# =============================================================================

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy dependency list first (Docker layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the API port
EXPOSE 8000

# Run the FastAPI server with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
