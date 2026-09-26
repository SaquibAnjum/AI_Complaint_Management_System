"""Authentication API routes supporting Multi-Organization and Role-Based Onboarding."""

from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required
from app.extensions import db
from app.models.organization import Organization, generate_slug
from app.models.user import User, UserRole
from app.utils.validators import (
    ALLOWED_ORG_TYPES,
    validate_organization_registration,
    validate_user_registration,
    validate_login_data,
)
from app.utils.helpers import api_response
from app.utils.decorators import get_current_user

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register-organization", methods=["POST"])
def register_organization():
    """Register a new organization and its initial administrator account in one transaction."""
    payload = request.get_json(silent=True) or {}
    errors = validate_organization_registration(payload)
    if errors:
        return api_response(
            success=False,
            message=errors[0],
            error="VALIDATION_ERROR",
            data={"errors": errors},
            status_code=422,
        )

    org_name = payload.get("organization_name").strip()
    raw_org_type = payload.get("organization_type", "").strip()
    org_type = next((t for t in ALLOWED_ORG_TYPES if t.lower() == raw_org_type.lower()), raw_org_type.capitalize())
    admin_name = payload.get("admin_name").strip()
    admin_email = payload.get("admin_email").strip().lower()
    phone = payload.get("phone", "").strip() or None
    password = payload.get("password")

    # Check if admin email is already registered
    existing_user = User.query.filter_by(email=admin_email).first()
    if existing_user:
        return api_response(
            success=False,
            message="An account with this email address already exists",
            error="EMAIL_ALREADY_EXISTS",
            status_code=409,
        )

    # Generate unique slug
    base_slug = generate_slug(org_name)
    slug = base_slug
    counter = 1
    while Organization.query.filter_by(slug=slug).first():
        counter += 1
        slug = f"{base_slug}-{counter}"

    try:
        # Create Organization (join_code is auto-generated = Organization ID for users)
        organization = Organization(
            name=org_name,
            slug=slug,
            organization_type=org_type,
            email=admin_email,
            phone=phone,
            is_active=True,
        )
        db.session.add(organization)
        db.session.flush()  # Obtain organization.id

        # Create Administrator user bound to this organization
        admin_user = User(
            name=admin_name,
            email=admin_email,
            password=password,
            organization_id=organization.id,
            role=UserRole.ADMIN,
            phone=phone,
            is_active=True,
        )
        db.session.add(admin_user)
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return api_response(
            success=False,
            message="Failed to create organization and administrator. Rolled back.",
            error="REGISTRATION_FAILED",
            status_code=500,
        )

    # Generate JWT access token with tenant claims
    access_token = create_access_token(
        identity=str(admin_user.id),
        additional_claims={
            "role": admin_user.role,
            "email": admin_user.email,
            "organization_id": admin_user.organization_id,
        },
    )

    return api_response(
        success=True,
        message="Organization and Administrator account created successfully",
        data={
            "token": access_token,
            "user": admin_user.to_dict(),
            "organization": organization.to_dict(),
        },
        status_code=201,
    )


@auth_bp.route("/organization-info/<string:slug>", methods=["GET"])
def get_organization_info(slug):
    """Retrieve public organization metadata for user join page by slug."""
    clean_slug = slug.strip().lower()
    org = Organization.query.filter_by(slug=clean_slug).first()
    if not org or not org.is_active:
        return api_response(
            success=False,
            message="Organization not found or is currently inactive",
            error="ORGANIZATION_NOT_FOUND",
            status_code=404,
        )

    return api_response(
        success=True,
        message="Organization info retrieved",
        data={"organization": org.to_dict()},
        status_code=200,
    )


@auth_bp.route("/join/<string:code>", methods=["GET"])
def join_organization_by_code(code):
    """Look up organization by join code (Organization ID) OR slug."""
    clean_code = code.strip().upper()
    clean_slug = code.strip().lower()

    # Try join_code first (exact uppercase match), then fall back to slug
    org = Organization.query.filter_by(join_code=clean_code, is_active=True).first()
    if not org:
        org = Organization.query.filter_by(slug=clean_slug, is_active=True).first()

    if not org:
        return api_response(
            success=False,
            message="No organization found with that code. Please check and try again.",
            error="ORGANIZATION_NOT_FOUND",
            status_code=404,
        )

    return api_response(
        success=True,
        message="Organization found",
        data={"organization": org.to_dict()},
        status_code=200,
    )


@auth_bp.route("/register-user", methods=["POST"])
def register_user():
    """Register an end-user into a specific organization via join code OR slug."""
    payload = request.get_json(silent=True) or {}

    # Support both join_code and org_slug as organization identifiers
    join_code = payload.get("join_code", "").strip().upper() if payload.get("join_code") else None
    org_slug = payload.get("org_slug", "").strip().lower() if payload.get("org_slug") else None

    # Resolve organization: try join_code first, then slug
    org = None
    if join_code:
        org = Organization.query.filter_by(join_code=join_code, is_active=True).first()
    if not org and org_slug:
        org = Organization.query.filter_by(slug=org_slug, is_active=True).first()

    if not org:
        return api_response(
            success=False,
            message="Invalid or inactive organization. Please check your Organization ID or join code.",
            error="ORGANIZATION_INVALID",
            status_code=404,
        )

    # Validate the rest of the payload
    errors = validate_user_registration(payload)
    if errors:
        return api_response(
            success=False,
            message=errors[0],
            error="VALIDATION_ERROR",
            data={"errors": errors},
            status_code=422,
        )

    name = payload.get("name").strip()
    email = payload.get("email").strip().lower()
    password = payload.get("password")
    phone = payload.get("phone", "").strip() or None

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return api_response(
            success=False,
            message="An account with this email address already exists",
            error="EMAIL_ALREADY_EXISTS",
            status_code=409,
        )

    new_user = User(
        name=name,
        email=email,
        password=password,
        organization_id=org.id,
        role=UserRole.USER,  # Strictly locked to USER
        phone=phone,
        is_active=True,
    )

    db.session.add(new_user)
    db.session.commit()

    access_token = create_access_token(
        identity=str(new_user.id),
        additional_claims={
            "role": new_user.role,
            "email": new_user.email,
            "organization_id": new_user.organization_id,
        },
    )

    return api_response(
        success=True,
        message="Account registered successfully",
        data={
            "token": access_token,
            "user": new_user.to_dict(),
        },
        status_code=201,
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    """Unified authentication endpoint for ADMIN and USER accounts."""
    payload = request.get_json(silent=True) or {}
    errors = validate_login_data(payload)
    if errors:
        return api_response(
            success=False,
            message=errors[0],
            error="VALIDATION_ERROR",
            data={"errors": errors},
            status_code=422,
        )

    email = payload.get("email").strip().lower()
    password = payload.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return api_response(
            success=False,
            message="Invalid email or password",
            error="INVALID_CREDENTIALS",
            status_code=401,
        )

    if not user.is_active:
        return api_response(
            success=False,
            message="Your account is inactive. Please contact your organization administrator.",
            error="ACCOUNT_INACTIVE",
            status_code=403,
        )

    # Check organization status
    if user.organization and not user.organization.is_active:
        return api_response(
            success=False,
            message="Your organization account is currently inactive. Please contact support.",
            error="ORGANIZATION_INACTIVE",
            status_code=403,
        )

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role,
            "email": user.email,
            "organization_id": user.organization_id,
        },
    )

    return api_response(
        success=True,
        message="Login successful",
        data={
            "token": access_token,
            "user": user.to_dict(),
        },
        status_code=200,
    )


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user_profile():
    """Fetch profile of currently authenticated user."""
    user = get_current_user()
    if not user:
        return api_response(
            success=False,
            message="User session not found or inactive",
            error="USER_NOT_FOUND",
            status_code=404,
        )

    return api_response(
        success=True,
        message="User profile fetched successfully",
        data={
            "user": user.to_dict(),
        },
        status_code=200,
    )


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """Client logout confirmation endpoint."""
    return api_response(
        success=True,
        message="Logged out successfully",
        status_code=200,
    )
