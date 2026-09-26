"""Feedback API routes with organization boundary validation."""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.complaint import Complaint, ComplaintStatus
from app.models.feedback import Feedback
from app.models.user import UserRole
from app.utils.decorators import get_current_user
from app.utils.helpers import api_response

feedback_bp = Blueprint("feedback", __name__, url_prefix="/api/complaints")


@feedback_bp.route("/<int:complaint_id>/feedback", methods=["POST"])
@jwt_required()
def submit_feedback(complaint_id):
    """Submit rating and review for a resolved/confirmed complaint."""
    user = get_current_user()
    complaint = Complaint.query.filter_by(id=complaint_id, organization_id=user.organization_id).first()

    if not complaint:
        return api_response(success=False, message="Complaint not found", error="COMPLAINT_NOT_FOUND", status_code=404)

    if complaint.user_id != user.id:
        return api_response(success=False, message="Only the complainant can submit feedback", error="FORBIDDEN", status_code=403)

    if complaint.status not in [ComplaintStatus.RESOLVED, ComplaintStatus.CONFIRMED]:
        return api_response(
            success=False,
            message="Feedback can only be provided for resolved or confirmed complaints",
            error="FEEDBACK_NOT_ALLOWED_YET",
            status_code=400,
        )

    # Check for existing feedback
    existing = Feedback.query.filter_by(complaint_id=complaint_id, organization_id=user.organization_id).first()
    if existing:
        return api_response(
            success=False,
            message="Feedback has already been submitted for this complaint",
            error="FEEDBACK_ALREADY_EXISTS",
            status_code=409,
        )

    payload = request.get_json(silent=True) or {}
    rating = payload.get("rating")
    comment = payload.get("comment", "").strip() if payload.get("comment") else None

    if rating is None or not isinstance(rating, int) or rating < 1 or rating > 5:
        return api_response(
            success=False,
            message="Rating must be an integer between 1 and 5",
            error="INVALID_RATING",
            status_code=422,
        )

    fb = Feedback(
        organization_id=user.organization_id,
        complaint_id=complaint.id,
        user_id=user.id,
        rating=rating,
        comment=comment,
    )
    db.session.add(fb)
    db.session.commit()

    return api_response(
        success=True,
        message="Thank you! Feedback submitted successfully.",
        data={"feedback": fb.to_dict()},
        status_code=201,
    )


@feedback_bp.route("/<int:complaint_id>/feedback", methods=["GET"])
@jwt_required()
def get_complaint_feedback(complaint_id):
    """Fetch feedback submitted for a specific complaint."""
    user = get_current_user()
    complaint = Complaint.query.filter_by(id=complaint_id, organization_id=user.organization_id).first()

    if not complaint:
        return api_response(success=False, message="Complaint not found", error="COMPLAINT_NOT_FOUND", status_code=404)

    if user.role == UserRole.USER and complaint.user_id != user.id:
        return api_response(success=False, message="Unauthorized access to feedback", error="FORBIDDEN", status_code=403)

    fb = Feedback.query.filter_by(complaint_id=complaint_id, organization_id=user.organization_id).first()
    if not fb:
        return api_response(
            success=False,
            message="No feedback submitted for this complaint yet",
            error="NO_FEEDBACK_FOUND",
            status_code=404,
        )

    return api_response(
        success=True,
        message="Feedback retrieved successfully",
        data={"feedback": fb.to_dict()},
        status_code=200,
    )
