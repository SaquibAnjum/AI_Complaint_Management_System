"""Complaint attachment metadata model."""

from datetime import datetime, timezone
from app.extensions import db


class ComplaintAttachment(db.Model):
    """Metadata for one file attached to a complaint."""

    __tablename__ = "complaint_attachments"

    id = db.Column(db.Integer, primary_key=True)

    complaint_id = db.Column(
        db.Integer,
        db.ForeignKey("complaints.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    original_filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False, unique=True)
    mime_type = db.Column(db.String(100), nullable=False)
    size_bytes = db.Column(db.Integer, nullable=False)

    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    complaint = db.relationship(
        "Complaint",
        back_populates="attachment",
    )