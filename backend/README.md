# Backend — AI-Assisted Complaint Management System

Flask REST API with JWT authentication, role-based authorization, SQLite database, and Google Gemini AI integration.

## Quick Start

### 1. Configure Environment
```bash
cp .env.example .env
```

### 2. Seed Database
```bash
uv run python seed.py
```

### 3. Run Development Server
```bash
uv run python run.py
```
Runs at `http://localhost:5000`

### 4. Run Automated Tests
```bash
uv run python -m unittest discover -s tests -p "test_*.py"
```

For complete system documentation and API reference, see the root [README.md](../README.md).
