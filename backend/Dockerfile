FROM python:3.12-slim

WORKDIR /app

# Install system dependencies if needed (e.g. for potential specific mysql drivers, though aiomysql is usually pure python or uses c extensions present in wheels)
# keeping it minimal for now.

# Install uv for fast dependency management
RUN pip install uv

# Copy pyproject.toml and uv.lock
COPY pyproject.toml uv.lock ./

# Install dependencies using uv
# We explicitly install dependencies from pyproject.toml
RUN uv pip install --system -r pyproject.toml

# Copy the rest of the application
COPY . .

# Expose the application port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
