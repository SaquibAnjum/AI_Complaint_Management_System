"""Administrator API routes with strict multi-tenant organization isolation."""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta, timezone
from app.extensions import db
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintStatus
from app.models.complaint_update import ComplaintUpdate
from app.models.organization import Organization
from app.utils.decorators import admin_required, get_current_user
from app.utils.validators import (
    ALLOWED_CATEGORIES,
    ALLOWED_PRIORITIES,
    ALLOWED_DEPARTMENTS,
)
from app.utils.helpers import api_response
from app.services.notification_service import notification_service

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/organization", methods=["GET"])
@jwt_required()
@admin_required
def get_admin_organization():
    """Return the current admin's organization details (includes join_code)."""
    admin = get_current_user()
    org = Organization.query.get(admin.organization_id)
    if not org:
        return api_response(
            success=False,
            message="Organization not found",
            error="ORGANIZATION_NOT_FOUND",
            status_code=404,
        )
    return api_response(
        success=True,
        message="Organization details retrieved",
        data={"organization": org.to_dict()},
        status_code=200,
    )


@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
@admin_required
def get_admin_stats():
    """Aggregate statistics for admin dashboard metrics strictly scoped to admin's organization."""
    admin = get_current_user()
    org_id = admin.organization_id

    base_query = Complaint.query.filter_by(organization_id=org_id)
    total_complaints = base_query.count()

    # Status distribution
    status_counts = {}
    for st in ComplaintStatus.ALL_STATUSES:
        status_counts[st] = base_query.filter_by(status=st).count()

    # Priority distribution
    priority_counts = {}
    for pr in ALLOWED_PRIORITIES:
        priority_counts[pr] = base_query.filter_by(priority=pr).count()

    # Category distribution
    category_counts = {}
    for cat in ALLOWED_CATEGORIES:
        category_counts[cat] = base_query.filter_by(category=cat).count()

    # Department distribution
    dept_counts = {}
    for dept in ALLOWED_DEPARTMENTS:
        dept_counts[dept] = base_query.filter_by(department=dept).count()

    # Active department distribution
    active_dept_counts = {}

    for dept in ALLOWED_DEPARTMENTS:
        active_dept_counts[dept] = (
            base_query
            .filter(
                Complaint.department == dept,
                Complaint.status.notin_(
                    [ComplaintStatus.RESOLVED, ComplaintStatus.CONFIRMED]
                ),
            )
            .count()
        )

    # High / Critical priority active count
    critical_or_high = base_query.filter(
        Complaint.priority.in_(["HIGH", "CRITICAL"]),
        Complaint.status.notin_([ComplaintStatus.RESOLVED, ComplaintStatus.CONFIRMED]),
    ).count()
    
    # Weekly trend for the last 6 weeks + current week
    today = datetime.now(timezone.utc)
    start_of_current_week = today - timedelta(days=today.weekday())

    trend_data = []

    for week_index in range(6, -1, -1):
        week_start = start_of_current_week - timedelta(weeks=week_index)
        week_end = week_start + timedelta(weeks=1)

        # Complaints received during this week
        received_count = base_query.filter(
            Complaint.created_at >= week_start,
            Complaint.created_at < week_end,
        ).count()

        # Complaints resolved during this week
        # We use ComplaintUpdate because resolved_at is not reliably populated
        resolved_count = ComplaintUpdate.query.filter(
            ComplaintUpdate.organization_id == org_id,
            ComplaintUpdate.status_to == ComplaintStatus.RESOLVED,
            ComplaintUpdate.created_at >= week_start,
            ComplaintUpdate.created_at < week_end,
        ).count()

        if week_index == 0:
            label = "Current"
        else:
            label = f"Week {7 - week_index}"

        trend_data.append({
            "label": label,
            "received": received_count,
            "resolved": resolved_count,
        })

    # Recent system audit activity
    recent_updates = (
        ComplaintUpdate.query
        .filter_by(organization_id=org_id)
        .order_by(ComplaintUpdate.created_at.desc())
        .limit(6)
        .all()
    )

    recent_activity = []

    for update in recent_updates:
        if update.status_from is None:
            activity_type = "COMPLAINT_CREATED"
        elif update.status_to == ComplaintStatus.RESOLVED:
            activity_type = "COMPLAINT_RESOLVED"
        else:
            activity_type = "STATUS_CHANGED"

        recent_activity.append({
            "id": update.id,
            "type": activity_type,
            "description": update.remark,
            "actor": update.user.name if update.user else "System",
            "ticket_id": f"CMP-{update.complaint_id}",
            "created_at": (
                update.created_at.isoformat()
                if update.created_at
                else None
            ),
        })

    # User counts within organization
    total_users = User.query.filter_by(role=UserRole.USER, organization_id=org_id).count()

    return api_response(
        success=True,
        message="Admin statistics retrieved successfully",
        data={
            "summary": {
                "total": total_complaints,
                "pending": status_counts.get(ComplaintStatus.PENDING, 0),
                "under_review": status_counts.get(ComplaintStatus.UNDER_REVIEW, 0),
                "in_progress": status_counts.get(ComplaintStatus.IN_PROGRESS, 0),
                "resolved": status_counts.get(ComplaintStatus.RESOLVED, 0),
                "reopened": status_counts.get(ComplaintStatus.REOPENED, 0),
                "confirmed": status_counts.get(ComplaintStatus.CONFIRMED, 0),
                "critical_or_high": critical_or_high,
                "total_users": total_users,
            },
            "status_distribution": status_counts,
            "priority_distribution": priority_counts,
            "category_distribution": category_counts,
            "department_distribution": dept_counts,
            "active_department_distribution": active_dept_counts,
            "trend_data": trend_data,
            "recent_activity": recent_activity,
        },
        status_code=200,
    )


@admin_bp.route("/complaints", methods=["GET"])
@jwt_required()
@admin_required
def get_all_complaints():
    """Retrieve complaints scoped to admin's organization with filters and search."""
    admin = get_current_user()
    org_id = admin.organization_id

    query = Complaint.query.filter_by(organization_id=org_id)

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

    # Sorting
    sort_by = request.args.get("sort_by", "created_at")
    sort_order = request.args.get("sort_order", "desc")
    sort_col = getattr(Complaint, sort_by, Complaint.created_at)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    # Pagination
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 10, type=int), 100)

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return api_response(
        success=True,
        message="Complaints retrieved successfully",
        data={"complaints": [c.to_dict(include_details=False) for c in pagination.items]},
        pagination={
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
        },
        status_code=200,
    )


@admin_bp.route("/complaints/<int:complaint_id>", methods=["GET"])
@jwt_required()
@admin_required
def get_admin_complaint_details(complaint_id):
    """Retrieve full complaint details strictly scoped to admin's organization."""
    admin = get_current_user()
    complaint = Complaint.query.filter_by(id=complaint_id, organization_id=admin.organization_id).first()
    if not complaint:
        return api_response(
            success=False,
            message="Complaint not found in your organization",
            error="COMPLAINT_NOT_FOUND",
            status_code=404,
        )

    return api_response(
        success=True,
        message="Complaint details retrieved",
        data={"complaint": complaint.to_dict(include_details=True)},
        status_code=200,
    )


@admin_bp.route("/complaints/<int:complaint_id>/review", methods=["PUT"])
@jwt_required()
@admin_required
def mark_under_review(complaint_id):
    """Transition complaint from PENDING to UNDER_REVIEW."""
    admin = get_current_user()
    complaint = Complaint.query.filter_by(id=complaint_id, organization_id=admin.organization_id).first()
    if not complaint:
        return api_response(success=False, message="Complaint not found", error="COMPLAINT_NOT_FOUND", status_code=404)

    if complaint.status == ComplaintStatus.PENDING:
        complaint.status = ComplaintStatus.UNDER_REVIEW
        update = ComplaintUpdate(
            organization_id=admin.organization_id,
            complaint_id=complaint.id,
            user_id=admin.id,
            status_from=ComplaintStatus.PENDING,
            status_to=ComplaintStatus.UNDER_REVIEW,
            remark=f"Complaint marked under review by administrator {admin.name}.",
        )
        db.session.add(update)
        notification_service.notify_status_updated(complaint, ComplaintStatus.UNDER_REVIEW)
        db.session.commit()

    return api_response(
        success=True,
        message="Complaint is now under administrative review",
        data={"complaint": complaint.to_dict(include_details=True)},
        status_code=200,
    )


@admin_bp.route("/complaints/<int:complaint_id>/classification", methods=["PUT"])
@jwt_required()
@admin_required
def override_classification(complaint_id):
    """Admin overrides or approves the classification (category, priority, department)."""
    admin = get_current_user()
    complaint = Complaint.query.filter_by(id=complaint_id, organization_id=admin.organization_id).first()
    if not complaint:
        return api_response(success=False, message="Complaint not found", error="COMPLAINT_NOT_FOUND", status_code=404)

    payload = request.get_json(silent=True) or {}
    category = payload.get("category", complaint.category)
    priority = payload.get("priority", complaint.priority)
    department = payload.get("department", complaint.department)

    if category not in ALLOWED_CATEGORIES:
        return api_response(
            success=False,
            message=f"Category must be one of: {', '.join(ALLOWED_CATEGORIES)}",
            error="INVALID_CATEGORY",
            status_code=422,
        )
    if priority not in ALLOWED_PRIORITIES:
        return api_response(
            success=False,
            message=f"Priority must be one of: {', '.join(ALLOWED_PRIORITIES)}",
            error="INVALID_PRIORITY",
            status_code=422,
        )
    if department not in ALLOWED_DEPARTMENTS:
        return api_response(
            success=False,
            message=f"Department must be one of: {', '.join(ALLOWED_DEPARTMENTS)}",
            error="INVALID_DEPARTMENT",
            status_code=422,
        )

    changes = []
    if category != complaint.category:
        changes.append(f"Category: {complaint.category} -> {category}")
        complaint.category = category
    if priority != complaint.priority:
        changes.append(f"Priority: {complaint.priority} -> {priority}")
        complaint.priority = priority
    if department != complaint.department:
        changes.append(f"Department: {complaint.department} -> {department}")
        complaint.department = department

    prev_status = complaint.status
    new_status = payload.get("status")
    if new_status and new_status in ComplaintStatus.ALL_STATUSES and new_status != prev_status:
        complaint.status = new_status
        changes.append(f"Status: {prev_status} -> {new_status}")

    remark = f"Admin {admin.name} updated: {', '.join(changes)}" if changes else "Admin confirmed classification."

    update = ComplaintUpdate(
        organization_id=admin.organization_id,
        complaint_id=complaint.id,
        user_id=admin.id,
        status_from=prev_status,
        status_to=complaint.status,
        remark=remark,
    )
    db.session.add(update)
    if new_status and new_status != prev_status:
        notification_service.notify_status_updated(complaint, new_status)
    db.session.commit()

    return api_response(
        success=True,
        message="Classification updated successfully",
        data={"complaint": complaint.to_dict(include_details=True)},
        status_code=200,
    )


@admin_bp.route("/complaints/<int:complaint_id>/status", methods=["PUT"])
@jwt_required()
@admin_required
def update_complaint_status_admin(complaint_id):
    """Admin manually updates complaint status to any valid status."""
    admin = get_current_user()
    complaint = Complaint.query.filter_by(id=complaint_id, organization_id=admin.organization_id).first()
    if not complaint:
        return api_response(success=False, message="Complaint not found", error="COMPLAINT_NOT_FOUND", status_code=404)

    payload = request.get_json(silent=True) or {}
    new_status = payload.get("status")
    remark = payload.get("remark", "").strip()

    if not new_status or new_status not in ComplaintStatus.ALL_STATUSES:
        return api_response(
            success=False,
            message=f"Invalid status. Must be one of: {', '.join(ComplaintStatus.ALL_STATUSES)}",
            error="INVALID_STATUS",
            status_code=422,
        )

    prev_status = complaint.status
    complaint.status = new_status

    if not remark:
        remark = f"Status updated to {new_status} by administrator {admin.name}."

    update = ComplaintUpdate(
        organization_id=admin.organization_id,
        complaint_id=complaint.id,
        user_id=admin.id,
        status_from=prev_status,
        status_to=new_status,
        remark=remark,
    )
    db.session.add(update)
    notification_service.notify_status_updated(complaint, new_status)
    db.session.commit()

    return api_response(
        success=True,
        message=f"Complaint status successfully updated to {new_status}",
        data={"complaint": complaint.to_dict(include_details=True)},
        status_code=200,
    )


@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@admin_required
def get_users_list():
    """Fetch registered users strictly belonging to admin's organization."""
    admin = get_current_user()
    org_id = admin.organization_id

    query = User.query.filter_by(organization_id=org_id)

    role = request.args.get("role")
    if role and role in UserRole.ALL_ROLES:
        query = query.filter_by(role=role)

    search = request.args.get("search", "").strip()
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(db.or_(User.name.ilike(search_fmt), User.email.ilike(search_fmt)))

    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 10, type=int), 100)

    pagination = query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    users_data = []

    for u in pagination.items:
        u_dict = u.to_dict()

        user_complaints = Complaint.query.filter_by(
            user_id=u.id,
            organization_id=org_id
        )

        total_complaints = user_complaints.count()

        active_complaints = user_complaints.filter(
            Complaint.status.notin_(
                [ComplaintStatus.RESOLVED, ComplaintStatus.CONFIRMED]
            )
        ).count()

        u_dict["complaints_count"] = total_complaints
        u_dict["active_complaints"] = active_complaints

        users_data.append(u_dict)

    return api_response(
        success=True,
        message="Users retrieved",
        data={"users": users_data},
        pagination={
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
        },
        status_code=200,
    )


@admin_bp.route("/users/<int:user_id>/status", methods=["PUT"])
@jwt_required()
@admin_required
def toggle_user_status(user_id):
    """Activate or deactivate a user account within admin's organization."""
    admin = get_current_user()
    user = User.query.filter_by(id=user_id, organization_id=admin.organization_id).first()
    if not user:
        return api_response(
            success=False,
            message="User not found in your organization",
            error="USER_NOT_FOUND",
            status_code=404,
        )

    if user.id == admin.id:
        return api_response(
            success=False,
            message="Cannot deactivate your own administrator account",
            error="FORBIDDEN",
            status_code=400,
        )

    payload = request.get_json(silent=True) or {}
    is_active = payload.get("is_active")
    if is_active is None or not isinstance(is_active, bool):
        user.is_active = not user.is_active
    else:
        user.is_active = is_active

    db.session.commit()
    status_label = "activated" if user.is_active else "deactivated"

    return api_response(
        success=True,
        message=f"User account {status_label} successfully",
        data={"user": user.to_dict()},
        status_code=200,
    )
