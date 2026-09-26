"""User database model."""

from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db


class UserRole:
    """User role constants."""
    USER = "USER"
    ADMIN = "ADMIN"

    ALL_ROLES = [USER, ADMIN]


class User(db.Model):
    """User database entity."""
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(30), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default=UserRole.USER, index=True)
    department = db.Column(db.String(100), nullable=True)
    designation = db.Column(db.String(100), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    complaints = db.relationship("Complaint", backref="author", lazy="dynamic", foreign_keys="Complaint.user_id")
    complaint_updates = db.relationship("ComplaintUpdate", backref="user", lazy="dynamic")
    feedback = db.relationship("Feedback", backref="user", lazy="dynamic")
    notifications = db.relationship("Notification", backref="user", lazy="dynamic", cascade="all, delete-orphan")

    def __init__(self, name, email, password, organization_id=None, role=UserRole.USER, phone=None, department=None, designation=None, is_active=True):
        self.name = name.strip()
        self.email = email.strip().lower()
        self.organization_id = organization_id
        if password:
            self.set_password(password)
        else:
            self.password_hash = "!"
        self.role = role if role in UserRole.ALL_ROLES else UserRole.USER
        self.phone = phone.strip() if phone else None
        self.department = department.strip() if department else None
        self.designation = designation.strip() if designation else None
        self.is_active = is_active

    def set_password(self, password):
        """Hash and set the user's password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify the password against the stored hash."""
        if not self.password_hash or self.password_hash == "!":
            return False
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Serialize user model to safe dictionary (no password hash)."""
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "organization_name": self.organization.name if self.organization else None,
            "organization_slug": self.organization.slug if self.organization else None,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "department": self.department,
            "designation": self.designation,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<User id={self.id} email='{self.email}' role='{self.role}' org={self.organization_id}>"
