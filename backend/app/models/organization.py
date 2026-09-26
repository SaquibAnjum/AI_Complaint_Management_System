"""Organization database model."""

from datetime import datetime, timezone
import re
import secrets
import string
from app.extensions import db


def generate_slug(name: str) -> str:
    """Generate a clean, URL-safe slug from organization name."""
    clean = re.sub(r"[^a-zA-Z0-9\s-]", "", name).strip().lower()
    slug = re.sub(r"[\s-]+", "-", clean)
    return slug or "org"


def generate_join_code(length: int = 8) -> str:
    """Generate a short, unique, uppercase alphanumeric join code (Organization ID)."""
    alphabet = string.ascii_uppercase + string.digits
    # Remove ambiguous characters O, 0, I, 1 for readability
    alphabet = alphabet.replace("O", "").replace("0", "").replace("I", "").replace("1", "")
    return "".join(secrets.choice(alphabet) for _ in range(length))


class OrganizationType:
    """Allowed organization classification types."""
    UNIVERSITY = "University"
    COLLEGE = "College"
    COMPANY = "Company"
    HOSPITAL = "Hospital"
    INSTITUTION = "Institution"
    OTHER = "Other"

    ALL_TYPES = [UNIVERSITY, COLLEGE, COMPANY, HOSPITAL, INSTITUTION, OTHER]


class Organization(db.Model):
    """Organization entity for multi-tenant isolation."""
    __tablename__ = "organizations"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False, index=True)
    join_code = db.Column(db.String(16), unique=True, nullable=True, index=True)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(30), nullable=True)
    address = db.Column(db.Text, nullable=True)
    organization_type = db.Column(db.String(50), nullable=False, default=OrganizationType.OTHER)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    users = db.relationship("User", backref="organization", lazy="dynamic", cascade="all, delete-orphan")
    complaints = db.relationship("Complaint", backref="organization", lazy="dynamic", cascade="all, delete-orphan")
    complaint_updates = db.relationship("ComplaintUpdate", backref="organization", lazy="dynamic", cascade="all, delete-orphan")
    notifications = db.relationship("Notification", backref="organization", lazy="dynamic", cascade="all, delete-orphan")

    def __init__(self, name, slug=None, organization_type=OrganizationType.OTHER, email=None, phone=None, address=None, is_active=True):
        self.name = name.strip()
        self.slug = slug or generate_slug(name)
        self.organization_type = organization_type if organization_type in OrganizationType.ALL_TYPES else OrganizationType.OTHER
        self.email = email.strip().lower() if email else None
        self.phone = phone.strip() if phone else None
        self.address = address.strip() if address else None
        self.is_active = is_active
        # Auto-generate a unique join code (this IS the Organization ID users enter to register)
        self.join_code = self._make_unique_join_code()

    @staticmethod
    def _make_unique_join_code() -> str:
        """Generate a join code that is not already in use."""
        for _ in range(20):
            code = generate_join_code()
            if not Organization.query.filter_by(join_code=code).first():
                return code
        return generate_join_code()  # fallback — extremely unlikely collision

    def to_dict(self):
        """Serialize organization to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "join_code": self.join_code,
            "organization_type": self.organization_type,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Organization id={self.id} name='{self.name}' slug='{self.slug}' join_code='{self.join_code}'>"
