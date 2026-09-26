"""Feedback database model."""

from datetime import datetime, timezone
from app.extensions import db


class Feedback(db.Model):
    """User feedback for resolved complaints."""
    __tablename__ = "feedback"

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False, index=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaints.id"), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    rating = db.Column(db.Integer, nullable=False)  # 1 to 5
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        """Serialize feedback record to dictionary."""
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "complaint_id": self.complaint_id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else None,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Feedback id={self.id} org={self.organization_id} complaint_id={self.complaint_id} rating={self.rating}>"
