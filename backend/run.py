"""Application entry point."""

import os
from app import create_app
from app.extensions import db

app = create_app(os.getenv("FLASK_ENV", "development"))


@app.cli.command("init-db")
def init_db():
    """Initialize database tables."""
    with app.app_context():
        from app import models  # noqa: F401
        db.create_all()
        print("Database tables initialized successfully.")


@app.cli.command("seed-db")
def seed_db_command():
    """Seed database with demo accounts and sample complaints."""
    from seed import seed_database
    with app.app_context():
        seed_database()



if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
