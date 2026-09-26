"""In-app notifications API routes with organization isolation."""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.notification import Notification
from app.utils.decorators import get_current_user
from app.utils.helpers import api_response

notification_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@notification_bp.route("", methods=["GET"])
@jwt_required()
def list_notifications():
    """Retrieve notifications for the current authenticated user in their organization."""
    user = get_current_user()
    if not user:
        return api_response(success=False, message="User not authenticated", error="UNAUTHORIZED", status_code=401)

    unread_only = request.args.get("unread_only", "false").lower() == "true"
    query = Notification.query.filter_by(user_id=user.id, organization_id=user.organization_id)

    if unread_only:
        query = query.filter_by(is_read=False)

    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    unread_count = Notification.query.filter_by(user_id=user.id, organization_id=user.organization_id, is_read=False).count()

    return api_response(
        success=True,
        message="Notifications retrieved successfully",
        data={
            "notifications": [n.to_dict() for n in notifications],
            "unread_count": unread_count,
        },
        status_code=200,
    )


@notification_bp.route("/<int:notification_id>/read", methods=["PUT"])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a specific notification as read."""
    user = get_current_user()
    notif = Notification.query.filter_by(id=notification_id, user_id=user.id, organization_id=user.organization_id).first()

    if not notif:
        return api_response(success=False, message="Notification not found", error="NOT_FOUND", status_code=404)

    notif.is_read = True
    db.session.commit()

    return api_response(
        success=True,
        message="Notification marked as read",
        data={"notification": notif.to_dict()},
        status_code=200,
    )


@notification_bp.route("/read-all", methods=["PUT"])
@jwt_required()
def mark_all_notifications_read():
    """Mark all notifications as read for current user."""
    user = get_current_user()
    if not user:
        return api_response(success=False, message="User not authenticated", error="UNAUTHORIZED", status_code=401)

    Notification.query.filter_by(user_id=user.id, organization_id=user.organization_id, is_read=False).update({"is_read": True})
    db.session.commit()

    return api_response(
        success=True,
        message="All notifications marked as read",
        status_code=200,
    )
