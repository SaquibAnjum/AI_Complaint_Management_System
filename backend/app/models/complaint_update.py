"""Complaint history / timeline updates model."""

from datetime import datetime, timezone
from app.extensions import db


class ComplaintUpdate(db.Model):
    """Audit log and timeline record for complaint changes."""
    __tablename__ = "complaint_updates"

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False, index=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaints.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    status_from = db.Column(db.String(30), nullable=True)
    status_to = db.Column(db.String(30), nullable=False)
    remark = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        """Serialize update history to dictionary."""
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "complaint_id": self.complaint_id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else "System",
            "user_role": self.user.role if self.user else "SYSTEM",
            "status_from": self.status_from,
            "status_to": self.status_to,
            "remark": self.remark,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<ComplaintUpdate id={self.id} org={self.organization_id} complaint_id={self.complaint_id} status_to='{self.status_to}'>"
