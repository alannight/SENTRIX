FROM python:3.12-slim

# Install uv for fast dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

WORKDIR /app

# Copy dependency files first for better layer caching
COPY pyproject.toml uv.lock ./

# Install dependencies (no dev extras in production)
RUN uv sync --frozen --no-dev

# Copy application source
COPY src/ ./src/
COPY migrations/ ./migrations/
COPY alembic.ini ./

# Run as non-root user
RUN addgroup --system sentrix && adduser --system --ingroup sentrix sentrix
USER sentrix

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "sentrix.main:app", "--app-dir", "src", "--host", "0.0.0.0", "--port", "8000"]
