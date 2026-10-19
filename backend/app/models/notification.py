
"""Notification database model."""

import re
from datetime import datetime, timezone

from app.extensions import db


class Notification(db.Model):
    """In-app notification entity."""

    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(
        db.Integer,
        db.ForeignKey("organizations.id"),
        nullable=False,
        index=True,
    )
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    complaint_id = db.Column(
        db.Integer,
        db.ForeignKey("complaints.id"),
        nullable=True,
        index=True,
    )

    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(
        db.Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    complaint = db.relationship(
        "Complaint",
        foreign_keys=[complaint_id],
    )

    def to_dict(self):
        """Serialize notification with the current display ticket ID."""
        display_message = self.message
        ticket_id = None

        if self.complaint:
            complaint = self.complaint
            ticket_number = complaint.ticket_number or complaint.id
            ticket_id = f"CMP-{ticket_number}"

            # Correct old ticket IDs when displaying historical messages.
            old_id = str(complaint.id)

            display_message = re.sub(
                rf"(?<![\w-])CMP-{re.escape(old_id)}(?!\d)",
                ticket_id,
                display_message,
                flags=re.IGNORECASE,
            )

            display_message = re.sub(
                rf"(?<!\w)#{re.escape(old_id)}(?!\d)",
                ticket_id,
                display_message,
            )

        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "user_id": self.user_id,
            "complaint_id": self.complaint_id,
            "ticket_id": ticket_id,
            "message": display_message,
            "is_read": self.is_read,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
        }

    def __repr__(self):
        return (
            f"<Notification id={self.id} org={self.organization_id} "
            f"user_id={self.user_id} read={self.is_read}>"
        )
