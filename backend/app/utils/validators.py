"""Validation utilities for user inputs and complaint payloads."""

import re

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

ALLOWED_CATEGORIES = [
    "Academic",
    "Fees",
    "Hostel",
    "Library",
    "Transport",
    "Infrastructure",
    "IT Support",
    "Security",
    "Cleanliness",
    "Other",
]

ALLOWED_PRIORITIES = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
]

ALLOWED_DEPARTMENTS = [
    "Academic Department",
    "Accounts",
    "Hostel Management",
    "IT Support",
    "Transport",
    "Administration",
    "Maintenance",
    "Security",
    "Housekeeping",
]

ALLOWED_ORG_TYPES = [
    "University",
    "College",
    "Company",
    "Hospital",
    "Institution",
    "Other",
]


def validate_organization_registration(data):
    """Validate organization + admin signup payload."""
    errors = []
    if not isinstance(data, dict):
        return ["Request payload must be a JSON object"]

    org_name = data.get("organization_name", "").strip()
    org_type = data.get("organization_type", "").strip()
    admin_name = data.get("admin_name", "").strip()
    admin_email = data.get("admin_email", "").strip().lower()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    if not org_name:
        errors.append("Organization name is required")
    elif len(org_name) < 2 or len(org_name) > 150:
        errors.append("Organization name must be between 2 and 150 characters")

    org_type_match = next((t for t in ALLOWED_ORG_TYPES if t.lower() == org_type.lower()), None)
    if not org_type:
        errors.append("Organization type is required")
    elif not org_type_match:
        errors.append(f"Organization type must be one of: {', '.join(ALLOWED_ORG_TYPES)}")

    if not admin_name:
        errors.append("Admin full name is required")
    elif len(admin_name) < 2 or len(admin_name) > 100:
        errors.append("Admin name must be between 2 and 100 characters")

    if not admin_email:
        errors.append("Admin email is required")
    elif not EMAIL_REGEX.match(admin_email) or len(admin_email) > 120:
        errors.append("Please provide a valid administrator email address")

    if not password:
        errors.append("Password is required")
    elif len(password) < 6:
        errors.append("Password must be at least 6 characters long")

    if confirm_password and password != confirm_password:
        errors.append("Passwords do not match")

    return errors


def validate_user_registration(data):
    """Validate user joining an organization via join code or slug."""
    errors = []
    if not isinstance(data, dict):
        return ["Request payload must be a JSON object"]

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    org_slug = data.get("org_slug", "").strip()
    join_code = (data.get("join_code") or data.get("organization_id") or "").strip()

    if not org_slug and not join_code:
        errors.append("Organization ID / Join code or organization slug is required")

    if not name:
        errors.append("Full name is required")
    elif len(name) < 2 or len(name) > 100:
        errors.append("Name must be between 2 and 100 characters")

    if not email:
        errors.append("Email is required")
    elif not EMAIL_REGEX.match(email) or len(email) > 120:
        errors.append("Please provide a valid email address")

    if not password:
        errors.append("Password is required")
    elif len(password) < 6:
        errors.append("Password must be at least 6 characters long")

    return errors


def validate_registration_data(data):
    """Legacy/general user registration payload."""
    errors = []
    if not isinstance(data, dict):
        return ["Request payload must be a JSON object"]

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not name:
        errors.append("Name is required")
    elif len(name) < 2 or len(name) > 100:
        errors.append("Name must be between 2 and 100 characters")

    if not email:
        errors.append("Email is required")
    elif not EMAIL_REGEX.match(email) or len(email) > 120:
        errors.append("Please provide a valid email address")

    if not password:
        errors.append("Password is required")
    elif len(password) < 6:
        errors.append("Password must be at least 6 characters long")

    return errors


def validate_login_data(data):
    """Validate user login payload."""
    errors = []
    if not isinstance(data, dict):
        return ["Request payload must be a JSON object"]

    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email:
        errors.append("Email is required")
    if not password:
        errors.append("Password is required")

    return errors


def validate_complaint_data(data, allow_classification=False):
    """Validate complaint creation or edit payload."""
    errors = []
    if not isinstance(data, dict):
        return ["Request payload must be a JSON object"]

    title = data.get("title", "").strip() if data.get("title") else ""
    description = data.get("description", "").strip() if data.get("description") else ""

    if not title:
        errors.append("Complaint title is required")
    elif len(title) < 5 or len(title) > 200:
        errors.append("Title must be between 5 and 200 characters")

    if not description:
        errors.append("Complaint description is required")
    elif len(description) < 10 or len(description) > 5000:
        errors.append("Description must be between 10 and 5000 characters")

    if allow_classification:
        category = data.get("category")
        priority = data.get("priority")
        department = data.get("department")

        if category and category not in ALLOWED_CATEGORIES:
            errors.append(f"Category must be one of: {', '.join(ALLOWED_CATEGORIES)}")
        if priority and priority not in ALLOWED_PRIORITIES:
            errors.append(f"Priority must be one of: {', '.join(ALLOWED_PRIORITIES)}")
        if department and department not in ALLOWED_DEPARTMENTS:
            errors.append(f"Department must be one of: {', '.join(ALLOWED_DEPARTMENTS)}")

    return errors
