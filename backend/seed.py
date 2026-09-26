"""Database seed script for the current ADMIN + USER architecture."""

from datetime import datetime, timezone, timedelta

from app.extensions import db
from app.models.organization import Organization, OrganizationType
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintStatus
from app.models.complaint_update import ComplaintUpdate
from app.models.feedback import Feedback
from app.models.notification import Notification


def seed_database():
    """Populate database with realistic multi-organization demo data."""

    print("Seeding database...")

    # Reset database
    db.drop_all()
    db.create_all()

    now = datetime.now(timezone.utc)

    # ==========================================================
    # ORGANIZATION A
    # ==========================================================

    org_a = Organization(
        name="Apex Global University",
        slug="apex-university",
        organization_type=OrganizationType.UNIVERSITY,
        email="admin@apex.edu",
        phone="+1 555-0199",
        address="100 Academic Way, Cambridge, MA",
        is_active=True,
    )

    db.session.add(org_a)
    db.session.flush()

    # Admin
    admin_a = User(
        name="System Administrator",
        email="admin@example.com",
        password="admin123",
        organization_id=org_a.id,
        role=UserRole.ADMIN,
        phone="+1 555-0101",
    )

    # Normal users
    user_alice = User(
        name="Alice Johnson",
        email="user@example.com",
        password="user123",
        organization_id=org_a.id,
        role=UserRole.USER,
        phone="+1 555-0102",
    )

    user_bob = User(
        name="Bob Smith",
        email="bob@example.com",
        password="user123",
        organization_id=org_a.id,
        role=UserRole.USER,
        phone="+1 555-0103",
    )

    db.session.add_all([admin_a, user_alice, user_bob])
    db.session.flush()

    # ==========================================================
    # COMPLAINT 1 - PENDING
    # ==========================================================

    complaint_1 = Complaint(
        organization_id=org_a.id,
        user_id=user_alice.id,
        title="Wi-Fi connectivity issue in Block C",
        description=(
            "The Wi-Fi connection in Block C library is disconnecting "
            "frequently and students are unable to access online resources."
        ),
        category="IT Support",
        priority="HIGH",
        department="IT Support",

        # AI suggestions
        ai_category="IT Support",
        ai_priority="HIGH",
        ai_department="IT Support",
        ai_summary=(
            "Wi-Fi connectivity issue affecting students in Block C library."
        ),
        ai_reasoning=(
            "The complaint describes repeated network disconnections "
            "affecting academic activities."
        ),
        ai_status="SUCCESS",

        status=ComplaintStatus.PENDING,
        created_at=now - timedelta(hours=5),
    )

    db.session.add(complaint_1)
    db.session.flush()

    update_1 = ComplaintUpdate(
        organization_id=org_a.id,
        complaint_id=complaint_1.id,
        user_id=user_alice.id,
        status_from=None,
        status_to=ComplaintStatus.PENDING,
        remark="Complaint submitted by Alice Johnson.",
        created_at=now - timedelta(hours=5),
    )

    notification_1 = Notification(
        organization_id=org_a.id,
        user_id=admin_a.id,
        complaint_id=complaint_1.id,
        message="New complaint submitted: Wi-Fi connectivity issue in Block C.",
        is_read=False,
        created_at=now - timedelta(hours=5),
    )

    db.session.add_all([update_1, notification_1])

    # ==========================================================
    # COMPLAINT 2 - IN PROGRESS
    # ==========================================================

    complaint_2 = Complaint(
        organization_id=org_a.id,
        user_id=user_bob.id,
        title="Water leakage in hostel bathroom",
        description=(
            "There is continuous water leakage in the hostel bathroom. "
            "The floor is getting flooded and may become a safety hazard."
        ),
        category="Hostel",
        priority="CRITICAL",
        department="Maintenance",

        # AI suggestions
        ai_category="Hostel",
        ai_priority="CRITICAL",
        ai_department="Maintenance",
        ai_summary=(
            "Continuous water leakage causing flooding in hostel bathroom."
        ),
        ai_reasoning=(
            "The leakage creates a potential safety hazard and may "
            "cause facility damage."
        ),
        ai_status="SUCCESS",

        status=ComplaintStatus.IN_PROGRESS,
        created_at=now - timedelta(days=1),
    )

    db.session.add(complaint_2)
    db.session.flush()

    update_2 = ComplaintUpdate(
        organization_id=org_a.id,
        complaint_id=complaint_2.id,
        user_id=admin_a.id,
        status_from=ComplaintStatus.PENDING,
        status_to=ComplaintStatus.UNDER_REVIEW,
        remark="Admin reviewed the complaint and started processing it.",
        created_at=now - timedelta(hours=20),
    )

    update_3 = ComplaintUpdate(
        organization_id=org_a.id,
        complaint_id=complaint_2.id,
        user_id=admin_a.id,
        status_from=ComplaintStatus.UNDER_REVIEW,
        status_to=ComplaintStatus.IN_PROGRESS,
        remark="Complaint moved to in-progress for resolution.",
        created_at=now - timedelta(hours=18),
    )

    notification_2 = Notification(
        organization_id=org_a.id,
        user_id=user_bob.id,
        complaint_id=complaint_2.id,
        message="Your complaint is now being processed.",
        is_read=False,
        created_at=now - timedelta(hours=18),
    )

    db.session.add_all([
        update_2,
        update_3,
        notification_2,
    ])

    # ==========================================================
    # ORGANIZATION B
    # ==========================================================

    org_b = Organization(
        name="Metro Institute of Health",
        slug="metro-health",
        organization_type=OrganizationType.HOSPITAL,
        email="admin@metrohealth.org",
        phone="+1 555-0800",
        address="500 Healthcare Blvd, New York, NY",
        is_active=True,
    )

    db.session.add(org_b)
    db.session.flush()

    # Admin
    admin_b = User(
        name="Metro Administrator",
        email="admin.metro@example.com",
        password="admin123",
        organization_id=org_b.id,
        role=UserRole.ADMIN,
        phone="+1 555-0801",
    )

    # Normal user
    user_carol = User(
        name="Carol Davis",
        email="carol@example.com",
        password="user123",
        organization_id=org_b.id,
        role=UserRole.USER,
        phone="+1 555-0802",
    )

    db.session.add_all([admin_b, user_carol])
    db.session.flush()

    # ==========================================================
    # COMPLAINT 3 - RESOLVED
    # ==========================================================

    complaint_3 = Complaint(
        organization_id=org_b.id,
        user_id=user_carol.id,
        title="Elevator malfunction in outpatient clinic",
        description=(
            "The elevator doors are not closing properly and the "
            "elevator is frequently stopping between floors."
        ),
        category="Infrastructure",
        priority="HIGH",
        department="Maintenance",

        # AI suggestions
        ai_category="Infrastructure",
        ai_priority="HIGH",
        ai_department="Maintenance",
        ai_summary=(
            "Elevator malfunction affecting movement inside the clinic."
        ),
        ai_reasoning=(
            "The issue may affect patient and staff mobility "
            "inside the healthcare facility."
        ),
        ai_status="SUCCESS",

        status=ComplaintStatus.RESOLVED,
        resolved_at=now - timedelta(hours=2),
        created_at=now - timedelta(hours=8),
    )

    db.session.add(complaint_3)
    db.session.flush()

    update_4 = ComplaintUpdate(
        organization_id=org_b.id,
        complaint_id=complaint_3.id,
        user_id=admin_b.id,
        status_from=ComplaintStatus.PENDING,
        status_to=ComplaintStatus.UNDER_REVIEW,
        remark="Admin reviewed the infrastructure complaint.",
        created_at=now - timedelta(hours=6),
    )

    update_5 = ComplaintUpdate(
        organization_id=org_b.id,
        complaint_id=complaint_3.id,
        user_id=admin_b.id,
        status_from=ComplaintStatus.UNDER_REVIEW,
        status_to=ComplaintStatus.IN_PROGRESS,
        remark="Complaint moved to in-progress for resolution.",
        created_at=now - timedelta(hours=4),
    )

    update_6 = ComplaintUpdate(
        organization_id=org_b.id,
        complaint_id=complaint_3.id,
        user_id=admin_b.id,
        status_from=ComplaintStatus.IN_PROGRESS,
        status_to=ComplaintStatus.RESOLVED,
        remark="Issue resolved by the organization.",
        created_at=now - timedelta(hours=2),
    )

    notification_3 = Notification(
        organization_id=org_b.id,
        user_id=user_carol.id,
        complaint_id=complaint_3.id,
        message="Your complaint has been marked as resolved.",
        is_read=False,
        created_at=now - timedelta(hours=2),
    )

    db.session.add_all([
        update_4,
        update_5,
        update_6,
        notification_3,
    ])

    # ==========================================================
    # FEEDBACK
    # ==========================================================

    feedback = Feedback(
        organization_id=org_b.id,
        complaint_id=complaint_3.id,
        user_id=user_carol.id,
        rating=5,
        comment="The issue was resolved successfully.",
        created_at=now - timedelta(hours=1),
    )

    db.session.add(feedback)

    # ==========================================================
    # COMMIT
    # ==========================================================

    db.session.commit()

    print("Database successfully seeded!")
    print()
    print("Organizations:")
    print("1. Apex Global University")
    print("2. Metro Institute of Health")
    print()
    print("Demo accounts:")
    print("Admin A: admin@example.com / admin123")
    print("User A:  user@example.com / user123")
    print("User B:  bob@example.com / user123")
    print("Admin B: admin.metro@example.com / admin123")
    print("User C:  carol@example.com / user123")


if __name__ == "__main__":
    from app import create_app

    app = create_app("development")

    with app.app_context():
        seed_database()