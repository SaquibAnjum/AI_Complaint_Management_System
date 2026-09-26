"""User and institutional complaint API routes with strict organization isolation."""

from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.complaint import Complaint, ComplaintStatus
from app.models.complaint_update import ComplaintUpdate
from app.models.user import UserRole
from app.utils.decorators import get_current_user
from app.utils.validators import validate_complaint_data
from app.utils.helpers import api_response
from app.services.ai_service import ai_service
from app.services.notification_service import notification_service

complaint_bp = Blueprint("complaints", __name__, url_prefix="/api/complaints")


@complaint_bp.route("", methods=["POST"])
@jwt_required()
def create_complaint():
    """Submit a new complaint with automatic AI classification and organization scoping."""
    user = get_current_user()
    if not user:
        return api_response(success=False, message="User not authenticated", error="UNAUTHORIZED", status_code=401)

    payload = request.get_json(silent=True) or {}
    errors = validate_complaint_data(payload, allow_classification=True)
    if errors:
        return api_response(
            success=False,
            message=errors[0],
            error="VALIDATION_ERROR",
            data={"errors": errors},
            status_code=422,
        )

    title = payload.get("title").strip()
    description = payload.get("description").strip()

    # Step 1: AI Assisted Analysis via Gemini Service
    ai_result = ai_service.analyze_complaint(title=title, description=description)

    # Initial classification: user can provide hints or defaults to AI recommendation
    initial_category = payload.get("category") or ai_result.get("category") or "Other"
    initial_priority = payload.get("priority") or ai_result.get("priority") or "MEDIUM"
    initial_department = payload.get("department") or ai_result.get("department") or "Administration"

    complaint = Complaint(
        organization_id=user.organization_id,  # Strictly derived from authenticated user
        user_id=user.id,
        title=title,
        description=description,
        category=initial_category,
        priority=initial_priority,
        department=initial_department,
        ai_category=ai_result.get("category"),
        ai_priority=ai_result.get("priority"),
        ai_department=ai_result.get("department"),
        ai_summary=ai_result.get("summary"),
        ai_reasoning=ai_result.get("reasoning"),
        ai_status=ai_result.get("ai_status", "PENDING"),
        status=ComplaintStatus.PENDING,
    )

    db.session.add(complaint)
    db.session.flush()  # Generate complaint.id

    # Step 2: Log initial timeline event
    initial_update = ComplaintUpdate(
        organization_id=user.organization_id,
        complaint_id=complaint.id,
        user_id=user.id,
        status_from=None,
        status_to=ComplaintStatus.PENDING,
        remark=f"Complaint filed by {user.name}. AI suggested category: '{complaint.ai_category}', priority: '{complaint.ai_priority}'.",
    )
    db.session.add(initial_update)

    # Step 3: Send confirmation notification
    notification_service.notify_complaint_submitted(complaint)

    db.session.commit()

    return api_response(
        success=True,
        message="Complaint submitted successfully",
        data={"complaint": complaint.to_dict(include_details=True)},
        status_code=201,
    )


@complaint_bp.route("", methods=["GET"])
@jwt_required()
def list_complaints():
    """List complaints with filtering and pagination. Enforces organization isolation and role scoping."""
    user = get_current_user()
    if not user:
        return api_response(success=False, message="User not authenticated", error="UNAUTHORIZED", status_code=401)

    org_id = user.organization_id
    query = Complaint.query.filter_by(organization_id=org_id)

    # Role-based access control: regular users only see their own complaints
    if user.role == UserRole.USER:
        query = query.filter_by(user_id=user.id)

    # Filters
    status = request.args.get("status")
    if status and status in ComplaintStatus.ALL_STATUSES:
        query = query.filter(Complaint.status == status)

    category = request.args.get("category")
    if category:
        query = query.filter(Complaint.category == category)

    priority = request.args.get("priority")
    if priority:
        query = query.filter(Complaint.priority == priority)

    department = request.args.get("department")
    if department:
        query = query.filter(Complaint.department == department)

    search = request.args.get("search", "").strip()
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            db.or_(
                Complaint.title.ilike(search_fmt),
                Complaint.description.ilike(search_fmt),
                Complaint.department.ilike(search_fmt),
            )
        )

    # Pagination
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 10, type=int), 100)

    pagination = query.order_by(Complaint.created_at.desc()).paginate(
        page=page,
        per_page=per_page,
        error_out=False,
    )

    complaints_data = [c.to_dict(include_details=False) for c in pagination.items]

    return api_response(
        success=True,
        message="Complaints retrieved successfully",
        data={"complaints": complaints_data},
        pagination={
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
        },
        status_code=200,
    )


@complaint_bp.route("/<int:complaint_id>", methods=["GET"])
@jwt_required()
def get_complaint_details(complaint_id):
    """Retrieve comprehensive details of a single complaint with organization boundary check."""
    user = get_current_user()
    if not user:
        return api_response(success=False, message="User not authenticated", error="UNAUTHORIZED", status_code=401)

    complaint = Complaint.query.filter_by(id=complaint_id, organization_id=user.organization_id).first()
    if not complaint:
        return api_response(
            success=False,
            message="Complaint not found in your organization",
            error="COMPLAINT_NOT_FOUND",
            status_code=404,
        )

    # Enforce role-based access control
    if user.role == UserRole.USER and complaint.user_id != user.id:
        return api_response(
            success=False,
            message="You do not have permission to view this complaint",
            error="FORBIDDEN_COMPLAINT_ACCESS",
            status_code=403,
        )

    return api_response(
        success=True,
        message="Complaint details retrieved successfully",
        data={"complaint": complaint.to_dict(include_details=True)},
        status_code=200,
    )


@complaint_bp.route("/<int:complaint_id>", methods=["PUT"])
@jwt_required()
def update_complaint(complaint_id):
    """Edit complaint content (only permitted for the author while in PENDING status, or admin)."""
    user = get_current_user()
    complaint = Complaint.query.filter_by(id=complaint_id, organization_id=user.organization_id).first()

    if not complaint:
        return api_response(success=False, message="Complaint not found", error="COMPLAINT_NOT_FOUND", status_code=404)

    if complaint.user_id != user.id and user.role != UserRole.ADMIN:
        return api_response(success=False, message="Unauthorized to modify this complaint", error="FORBIDDEN", status_code=403)

    if complaint.status != ComplaintStatus.PENDING and user.role != UserRole.ADMIN:
        return api_response(
            success=False,
            message="Complaints cannot be edited once under review",
            error="COMPLAINT_LOCKED",
            status_code=400,
        )

    payload = request.get_json(silent=True) or {}
    errors = validate_complaint_data(payload, allow_classification=(user.role == UserRole.ADMIN))
    if errors:
        return api_response(success=False, message=errors[0], error="VALIDATION_ERROR", data={"errors": errors}, status_code=422)

    complaint.title = payload.get("title", complaint.title).strip()
    complaint.description = payload.get("description", complaint.description).strip()

    if user.role == UserRole.ADMIN:
        if "category" in payload:
            complaint.category = payload["category"]
        if "priority" in payload:
            complaint.priority = payload["priority"]
        if "department" in payload:
            complaint.department = payload["department"]

    update_entry = ComplaintUpdate(
        organization_id=user.organization_id,
        complaint_id=complaint.id,
        user_id=user.id,
        status_from=complaint.status,
        status_to=complaint.status,
        remark=f"Complaint content updated by {user.name}.",
    )
    db.session.add(update_entry)
    db.session.commit()

    return api_response(
        success=True,
        message="Complaint updated successfully",
        data={"complaint": complaint.to_dict(include_details=True)},
        status_code=200,
    )


@complaint_bp.route("/<int:complaint_id>/confirm", methods=["POST"])
@jwt_required()
def confirm_resolution(complaint_id):
    """Complainant confirms that the resolution is satisfactory."""
    user = get_current_user()
    complaint = Complaint.query.filter_by(id=complaint_id, organization_id=user.organization_id).first()

    if not complaint:
        return api_response(success=False, message="Complaint not found", error="COMPLAINT_NOT_FOUND", status_code=404)

    if complaint.user_id != user.id:
        return api_response(success=False, message="Only the complainant can confirm resolution", error="FORBIDDEN", status_code=403)

    if complaint.status != ComplaintStatus.RESOLVED:
        return api_response(
            success=False,
            message=f"Cannot confirm resolution for a complaint in '{complaint.status}' status (must be RESOLVED)",
            error="INVALID_STATUS_TRANSITION",
            status_code=400,
        )

    complaint.status = ComplaintStatus.CONFIRMED
    update_log = ComplaintUpdate(
        organization_id=user.organization_id,
        complaint_id=complaint.id,
        user_id=user.id,
        status_from=ComplaintStatus.RESOLVED,
        status_to=ComplaintStatus.CONFIRMED,
        remark="Complainant verified and confirmed satisfactory resolution.",
    )
    db.session.add(update_log)

    notification_service.send(
        organization_id=user.organization_id,
        user_id=complaint.user_id,
        complaint_id=complaint.id,
        message=f"Thank you for confirming the resolution of complaint #{complaint.id}.",
    )

    db.session.commit()

    return api_response(
        success=True,
        message="Resolution confirmed successfully. You can now leave feedback.",
        data={"complaint": complaint.to_dict(include_details=True)},
        status_code=200,
    )


@complaint_bp.route("/<int:complaint_id>/reject", methods=["POST"])
@jwt_required()
def reject_resolution(complaint_id):
    """Complainant rejects resolution, moving complaint back to REOPENED."""
    user = get_current_user()
    complaint = Complaint.query.filter_by(id=complaint_id, organization_id=user.organization_id).first()

    if not complaint:
        return api_response(success=False, message="Complaint not found", error="COMPLAINT_NOT_FOUND", status_code=404)

    if complaint.user_id != user.id:
        return api_response(success=False, message="Only the complainant can reject resolution", error="FORBIDDEN", status_code=403)

    if complaint.status != ComplaintStatus.RESOLVED:
        return api_response(
            success=False,
            message=f"Cannot reject resolution for a complaint in '{complaint.status}' status (must be RESOLVED)",
            error="INVALID_STATUS_TRANSITION",
            status_code=400,
        )

    payload = request.get_json(silent=True) or {}
    reason = payload.get("reason", "").strip()
    if not reason:
        return api_response(
            success=False,
            message="Please provide a specific reason for rejecting the resolution",
            error="REJECTION_REASON_REQUIRED",
            status_code=422,
        )

    complaint.status = ComplaintStatus.REOPENED
    update_log = ComplaintUpdate(
        organization_id=user.organization_id,
        complaint_id=complaint.id,
        user_id=user.id,
        status_from=ComplaintStatus.RESOLVED,
        status_to=ComplaintStatus.REOPENED,
        remark=f"Resolution rejected by user. Reason: {reason}",
    )
    db.session.add(update_log)

    notification_service.notify_reopened(complaint)

    db.session.commit()

    return api_response(
        success=True,
        message="Resolution rejected. Complaint has been reopened.",
        data={"complaint": complaint.to_dict(include_details=True)},
        status_code=200,
    )


@complaint_bp.route("/<int:complaint_id>/reopen", methods=["POST"])
@jwt_required()
def reopen_complaint(complaint_id):
    """Reopen a resolved or confirmed complaint."""
    user = get_current_user()
    complaint = Complaint.query.filter_by(id=complaint_id, organization_id=user.organization_id).first()

    if not complaint:
        return api_response(success=False, message="Complaint not found", error="COMPLAINT_NOT_FOUND", status_code=404)

    if complaint.user_id != user.id and user.role != UserRole.ADMIN:
        return api_response(success=False, message="Unauthorized to reopen this complaint", error="FORBIDDEN", status_code=403)

    if complaint.status not in [ComplaintStatus.RESOLVED, ComplaintStatus.CONFIRMED]:
        return api_response(
            success=False,
            message=f"Cannot reopen a complaint that is currently '{complaint.status}'",
            error="INVALID_STATUS_TRANSITION",
            status_code=400,
        )

    payload = request.get_json(silent=True) or {}
    reason = payload.get("reason", "Reopened by user").strip()

    previous_status = complaint.status
    complaint.status = ComplaintStatus.REOPENED
    update_log = ComplaintUpdate(
        organization_id=user.organization_id,
        complaint_id=complaint.id,
        user_id=user.id,
        status_from=previous_status,
        status_to=ComplaintStatus.REOPENED,
        remark=f"Complaint reopened by {user.name}. Reason: {reason}",
    )
    db.session.add(update_log)

    notification_service.notify_reopened(complaint)

    db.session.commit()

    return api_response(
        success=True,
        message="Complaint reopened successfully",
        data={"complaint": complaint.to_dict(include_details=True)},
        status_code=200,
    )
