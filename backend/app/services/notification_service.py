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
        """Notify the complainant and organization administrators when a new complaint is filed."""

        # Notify the user who submitted the complaint.
        NotificationService.send(
            user_id=complaint.user_id,
            complaint_id=complaint.id,
            organization_id=complaint.organization_id,
            message=f"Your complaint #{complaint.id} ('{complaint.title[:30]}') has been submitted successfully.",
        )

        # Notify all administrators in the same organization.
        admins = User.query.filter_by(
            organization_id=complaint.organization_id,
            role="ADMIN",
            is_active=True,
        ).all()

        for admin in admins:
            NotificationService.send(
                user_id=admin.id,
                complaint_id=complaint.id,
                organization_id=complaint.organization_id,
                message=f"New complaint submitted: {complaint.title[:50]} (CMP-{complaint.id}).",
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
        """Notify the complainant and organization administrators when a complaint is reopened."""

        # Notify the user who reopened the complaint.
        NotificationService.send(
            user_id=complaint.user_id,
            complaint_id=complaint.id,
            organization_id=complaint.organization_id,
            message=f"Your complaint #{complaint.id} has been reopened for further investigation.",
        )

        # Notify all active administrators in the same organization.
        admins = User.query.filter_by(
            organization_id=complaint.organization_id,
            role="ADMIN",
            is_active=True,
        ).all()

        complainant = User.query.get(complaint.user_id)
        complainant_name = complainant.name if complainant else "A user"

        for admin in admins:
            NotificationService.send(
                user_id=admin.id,
                complaint_id=complaint.id,
                organization_id=complaint.organization_id,
                message=(
                    f"Complaint reopened by {complainant_name} "
                    f"(CMP-{complaint.id})."
                ),
            )


notification_service = NotificationService()
