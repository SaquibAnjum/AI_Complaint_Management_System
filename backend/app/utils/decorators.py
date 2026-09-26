"""Authentication and Authorization Decorators."""

from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from app.extensions import db
from app.models.user import User, UserRole
from app.utils.helpers import api_response


def get_current_user():
    """Retrieve the User model instance for the active JWT session."""
    user_id = get_jwt_identity()
    if not user_id:
        return None
    try:
        user = db.session.get(User, int(user_id))
    except (TypeError, ValueError):
        return None
    if not user or not user.is_active:
        return None
    if user.organization and not user.organization.is_active:
        return None
    return user


def role_required(allowed_roles):
    """Decorator to enforce role-based access control.
    
    Usage:
        @role_required([UserRole.ADMIN, UserRole.STAFF])
        def some_route():
            ...
    """
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()

            user = get_current_user()
            if not user:
                return api_response(
                    success=False,
                    message="User account or organization not found or deactivated",
                    error="ACCOUNT_INACTIVE",
                    status_code=401,
                )

            # Check DB role for definitive authorization
            if user.role not in allowed_roles:
                return api_response(
                    success=False,
                    message=f"Access forbidden: requires one of {allowed_roles}",
                    error="FORBIDDEN_ROLE",
                    status_code=403,
                )

            return fn(*args, **kwargs)

        return wrapper

    return decorator


def admin_required(fn):
    """Enforce ADMIN role authorization."""
    return role_required([UserRole.ADMIN])(fn)


def user_required(fn):
    """Enforce standard USER role authorization."""
    return role_required([UserRole.USER])(fn)
