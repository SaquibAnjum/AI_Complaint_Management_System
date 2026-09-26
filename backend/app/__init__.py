"""Flask Application Factory module."""

import os
from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException

from app.config import config_by_name
from app.extensions import db, jwt, cors
from app.utils.helpers import api_response


def create_app(config_name=None):
    """Factory to create and configure the Flask application."""
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    config_obj = config_by_name.get(config_name, config_by_name["development"])
    app.config.from_object(config_obj)

    # Initialize Extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": [app.config["FRONTEND_URL"], "http://localhost:3000", "http://127.0.0.1:5173", "*"]}},
        supports_credentials=True,
    )

    # Register centralized error handlers
    register_error_handlers(app)

    # Register JWT error callbacks
    register_jwt_callbacks(jwt)

    # Health check endpoint
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return api_response(
            success=True,
            message="Complaint Management System API is healthy",
            data={
                "status": "online",
                "environment": config_name,
                "version": "1.0.0",
            },
            status_code=200,
        )

    # Register routes / blueprints will be hooked up here
    register_blueprints(app)

    return app


def register_jwt_callbacks(jwt_manager):
    """Configure JWT error handling callbacks."""
    @jwt_manager.unauthorized_loader
    def unauthorized_response(callback):
        return api_response(
            success=False,
            message="Missing authorization token",
            error="AUTH_TOKEN_MISSING",
            status_code=401,
        )

    @jwt_manager.invalid_token_loader
    def invalid_token_response(callback):
        return api_response(
            success=False,
            message="Invalid or corrupted authorization token",
            error="AUTH_TOKEN_INVALID",
            status_code=401,
        )

    @jwt_manager.expired_token_loader
    def expired_token_response(jwt_header, jwt_payload):
        return api_response(
            success=False,
            message="Token has expired. Please log in again.",
            error="AUTH_TOKEN_EXPIRED",
            status_code=401,
        )


def register_error_handlers(app):
    """Register centralized HTTP error handlers."""
    @app.errorhandler(400)
    def bad_request(e):
        return api_response(
            success=False,
            message=str(e.description) if hasattr(e, "description") else "Bad request",
            error="BAD_REQUEST",
            status_code=400,
        )

    @app.errorhandler(401)
    def unauthorized(e):
        return api_response(
            success=False,
            message="Authentication required",
            error="UNAUTHORIZED",
            status_code=401,
        )

    @app.errorhandler(403)
    def forbidden(e):
        return api_response(
            success=False,
            message="You do not have permission to access this resource",
            error="FORBIDDEN",
            status_code=403,
        )

    @app.errorhandler(404)
    def not_found(e):
        return api_response(
            success=False,
            message="Resource not found",
            error="NOT_FOUND",
            status_code=404,
        )

    @app.errorhandler(405)
    def method_not_allowed(e):
        return api_response(
            success=False,
            message="Method not allowed for this endpoint",
            error="METHOD_NOT_ALLOWED",
            status_code=405,
        )

    @app.errorhandler(409)
    def conflict(e):
        return api_response(
            success=False,
            message=str(e.description) if hasattr(e, "description") else "Resource conflict",
            error="CONFLICT",
            status_code=409,
        )

    @app.errorhandler(422)
    def unprocessable_entity(e):
        return api_response(
            success=False,
            message="Unprocessable entity or validation failed",
            error="VALIDATION_ERROR",
            status_code=422,
        )

    @app.errorhandler(500)
    def internal_server_error(e):
        return api_response(
            success=False,
            message="An unexpected server error occurred",
            error="INTERNAL_SERVER_ERROR",
            status_code=500,
        )


def register_blueprints(app):
    """Register application route blueprints."""
    from app.routes.auth_routes import auth_bp
    from app.routes.complaint_routes import complaint_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.feedback_routes import feedback_bp
    from app.routes.notification_routes import notification_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(complaint_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(feedback_bp)
    app.register_blueprint(notification_bp)


