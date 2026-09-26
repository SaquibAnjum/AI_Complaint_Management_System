"""Complaint database model."""

from datetime import datetime, timezone
from app.extensions import db


class ComplaintStatus:
    """Complaint lifecycle statuses — Organization manually drives these stages."""
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CONFIRMED = "CONFIRMED"
    REOPENED = "REOPENED"

    ALL_STATUSES = [
        PENDING,
        UNDER_REVIEW,
        IN_PROGRESS,
        RESOLVED,
        CONFIRMED,
        REOPENED,
    ]


class Complaint(db.Model):
    """Complaint database entity."""
    __tablename__ = "complaints"

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)

    # Final / Admin-approved classification
    category = db.Column(db.String(50), nullable=False, default="Other", index=True)
    priority = db.Column(db.String(20), nullable=False, default="MEDIUM", index=True)
    department = db.Column(db.String(100), nullable=False, default="Administration", index=True)

    # AI-assisted suggestions (advisory only — does NOT drive workflow)
    ai_category = db.Column(db.String(50), nullable=True)
    ai_priority = db.Column(db.String(20), nullable=True)
    ai_department = db.Column(db.String(100), nullable=True)
    ai_summary = db.Column(db.Text, nullable=True)
    ai_reasoning = db.Column(db.Text, nullable=True)
    ai_status = db.Column(db.String(20), default="PENDING", nullable=False)  # PENDING, SUCCESS, FAILED

    status = db.Column(db.String(30), nullable=False, default=ComplaintStatus.PENDING, index=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    resolved_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    updates = db.relationship("ComplaintUpdate", backref="complaint", lazy="dynamic", cascade="all, delete-orphan")
    feedback = db.relationship("Feedback", backref="complaint", uselist=False, cascade="all, delete-orphan")

    def to_dict(self, include_details=False):
        """Serialize complaint entity to dictionary."""
        data = {
            "id": self.id,
            "organization_id": self.organization_id,
            "organization_name": self.organization.name if self.organization else None,
            "user_id": self.user_id,
            "user_name": self.author.name if self.author else None,
            "user_email": self.author.email if self.author else None,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "priority": self.priority,
            "department": self.department,
            "summary": self.ai_summary or self.description[:120],
            "ai_category": self.ai_category,
            "ai_priority": self.ai_priority,
            "ai_department": self.ai_department,
            "ai_summary": self.ai_summary,
            "ai_reasoning": self.ai_reasoning,
            "ai_status": self.ai_status,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }

        if include_details:
            data["updates"] = [u.to_dict() for u in self.updates.order_by("created_at").all()]
            data["feedback"] = self.feedback.to_dict() if self.feedback else None

        return data

    def __repr__(self):
        return f"<Complaint id={self.id} org={self.organization_id} title='{self.title[:20]}' status='{self.status}'>"
