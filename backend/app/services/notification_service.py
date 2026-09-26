"""In-app notification helper service supporting multi-tenancy."""

from app.extensions import db
from app.models.notification import Notification
from app.models.user import User


class NotificationService:
    """Service to create and manage system notifications."""

    @staticmethod
    def send(user_id: int, message: str, complaint_id: int = None, organization_id: int = None):
        """Create a new notification entry for a user."""
        if not user_id or not message:
            return None

        # Derive organization_id if not provided
        if not organization_id:
            user = db.session.get(User, user_id)
            if user:
                organization_id = user.organization_id

        if not organization_id:
            organization_id = 1

        notif = Notification(
            organization_id=organization_id,
            user_id=user_id,
            complaint_id=complaint_id,
            message=message,
            is_read=False,
        )
        db.session.add(notif)
        return notif

    @staticmethod
    def notify_complaint_submitted(complaint):
        """Send notification when a user files a new complaint."""
        return NotificationService.send(
            user_id=complaint.user_id,
            complaint_id=complaint.id,
            organization_id=complaint.organization_id,
            message=f"Your complaint #{complaint.id} ('{complaint.title[:30]}') has been submitted successfully.",
        )

    @staticmethod
    def notify_status_updated(complaint, status_to):
        """Notify complainant about progress updates."""
        readable_status = status_to.replace("_", " ").title()
        NotificationService.send(
            user_id=complaint.user_id,
            complaint_id=complaint.id,
            organization_id=complaint.organization_id,
            message=f"Your complaint #{complaint.id} status changed to: {readable_status}.",
        )

    @staticmethod
    def notify_reopened(complaint):
        """Notify user when complaint is reopened."""
        NotificationService.send(
            user_id=complaint.user_id,
            complaint_id=complaint.id,
            organization_id=complaint.organization_id,
            message=f"Your complaint #{complaint.id} has been reopened for further investigation.",
        )


notification_service = NotificationService()
