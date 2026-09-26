"""Application routes package."""

from app.routes.auth_routes import auth_bp
from app.routes.complaint_routes import complaint_bp
from app.routes.admin_routes import admin_bp
from app.routes.feedback_routes import feedback_bp
from app.routes.notification_routes import notification_bp

__all__ = [
    "auth_bp",
    "complaint_bp",
    "admin_bp",
    "feedback_bp",
    "notification_bp",
]
