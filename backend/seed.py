"""Database seed script with multi-organization support and realistic data."""

from datetime import datetime, timezone, timedelta
from app.extensions import db
from app.models.organization import Organization, OrganizationType
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintStatus
from app.models.assignment import Assignment
from app.models.complaint_update import ComplaintUpdate
from app.models.feedback import Feedback
from app.models.notification import Notification


def seed_database():
    """Populate database with multi-tenant organizations, accounts, and complaints."""
    print("Seeding multi-organization database...")

    db.drop_all()
    db.create_all()

    now = datetime.now(timezone.utc)

    # ==========================================
    # 1. ORGANIZATION A: Apex Global University
    # ==========================================
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

    admin_a = User(
        name="System Administrator (Apex)",
        email="admin@example.com",
        password="admin123",
        organization_id=org_a.id,
        role=UserRole.ADMIN,
        phone="+1 555-0101",
    )
    staff_maint_a = User(
        name="Rajesh Kumar",
        email="staff@example.com",
        password="staff123",
        organization_id=org_a.id,
        role=UserRole.STAFF,
        department="Maintenance",
        designation="Senior Facilities Technician",
        phone="+1 555-0102",
    )
    staff_it_a = User(
        name="Priya Sharma",
        email="itstaff@example.com",
        password="staff123",
        organization_id=org_a.id,
        role=UserRole.STAFF,
        department="IT Support",
        designation="Lead Systems Engineer",
        phone="+1 555-0103",
    )
    user_alice_a = User(
        name="Alice Johnson",
        email="user@example.com",
        password="user123",
        organization_id=org_a.id,
        role=UserRole.USER,
        phone="+1 555-0104",
    )
    user_bob_a = User(
        name="Bob Smith",
        email="bob@example.com",
        password="user123",
        organization_id=org_a.id,
        role=UserRole.USER,
        phone="+1 555-0105",
    )

    db.session.add_all([admin_a, staff_maint_a, staff_it_a, user_alice_a, user_bob_a])
    db.session.flush()

    # Complaints for Org A
    c1_a = Complaint(
        organization_id=org_a.id,
        user_id=user_alice_a.id,
        title="Wi-Fi connectivity completely down in Block C Library",
        description="The 5GHz and 2.4GHz academic Wi-Fi networks in Block C second floor study area have been disconnecting repeatedly for the past 24 hours.",
        category="IT Support",
        priority="HIGH",
        department="IT Support",
        ai_category="IT Support",
        ai_priority="HIGH",
        ai_department="IT Support",
        ai_summary="Wi-Fi network outage affecting students in Block C study rooms.",
        ai_reasoning="Network infrastructure issue impacting academic productivity in study zones.",
        ai_status="SUCCESS",
        status=ComplaintStatus.PENDING,
        created_at=now - timedelta(hours=3),
    )
    db.session.add(c1_a)
    db.session.flush()

    u1_a = ComplaintUpdate(
        organization_id=org_a.id,
        complaint_id=c1_a.id,
        user_id=user_alice_a.id,
        status_from=None,
        status_to=ComplaintStatus.PENDING,
        remark="Complaint registered by Alice Johnson. AI suggested IT Support (Priority: HIGH).",
        created_at=now - timedelta(hours=3),
    )
    db.session.add(u1_a)

    c2_a = Complaint(
        organization_id=org_a.id,
        user_id=user_bob_a.id,
        assigned_staff_id=staff_maint_a.id,
        title="Severe water leakage in Boys Hostel 2, Room 304 bathroom",
        description="The overhead flush pipe is continuously leaking water, flooding the bathroom floor and creating a slip hazard.",
        category="Hostel",
        priority="CRITICAL",
        department="Maintenance",
        ai_category="Hostel",
        ai_priority="CRITICAL",
        ai_department="Maintenance",
        ai_summary="Continuous plumbing leak causing bathroom flooding in hostel room 304.",
        ai_reasoning="Water leakage and flooding poses immediate slip hazards and facility damage.",
        ai_status="SUCCESS",
        status=ComplaintStatus.ASSIGNED,
        created_at=now - timedelta(days=1),
    )
    db.session.add(c2_a)
    db.session.flush()

    asgn2_a = Assignment(
        organization_id=org_a.id,
        complaint_id=c2_a.id,
        staff_id=staff_maint_a.id,
        assigned_by_id=admin_a.id,
        status="ACTIVE",
        notes="High urgency. Inspect and isolate water valve immediately.",
        assigned_at=now - timedelta(hours=18),
    )
    u2_a = ComplaintUpdate(
        organization_id=org_a.id,
        complaint_id=c2_a.id,
        user_id=admin_a.id,
        status_from=ComplaintStatus.PENDING,
        status_to=ComplaintStatus.ASSIGNED,
        remark="Admin assigned to Rajesh Kumar (Maintenance). Urgent leak.",
        created_at=now - timedelta(hours=18),
    )
    db.session.add_all([asgn2_a, u2_a])

    # ==========================================
    # 2. ORGANIZATION B: Metro Institute of Health
    # ==========================================
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

    admin_b = User(
        name="Dr. Marcus Vance",
        email="admin.metro@example.com",
        password="admin123",
        organization_id=org_b.id,
        role=UserRole.ADMIN,
        phone="+1 555-0801",
    )
    staff_b = User(
        name="Sarah Jenkins",
        email="staff.metro@example.com",
        password="staff123",
        organization_id=org_b.id,
        role=UserRole.STAFF,
        department="Maintenance",
        designation="Biomedical Equipment Specialist",
        phone="+1 555-0802",
    )
    user_carol_b = User(
        name="Carol Davis",
        email="carol@example.com",
        password="user123",
        organization_id=org_b.id,
        role=UserRole.USER,
        phone="+1 555-0803",
    )

    db.session.add_all([admin_b, staff_b, user_carol_b])
    db.session.flush()

    c1_b = Complaint(
        organization_id=org_b.id,
        user_id=user_carol_b.id,
        assigned_staff_id=staff_b.id,
        title="Elevator B malfunctioning in Outpatient Clinic",
        description="The door sensors on elevator B in the main pavilion are stuttering and refusing to close smoothly.",
        category="Infrastructure",
        priority="HIGH",
        department="Maintenance",
        ai_category="Infrastructure",
        ai_priority="HIGH",
        ai_department="Maintenance",
        ai_summary="Elevator B doors in Outpatient Clinic malfunctioning.",
        ai_reasoning="Vertical transportation issue causing delays in patient mobility.",
        ai_status="SUCCESS",
        status=ComplaintStatus.IN_PROGRESS,
        created_at=now - timedelta(hours=5),
    )
    db.session.add(c1_b)
    db.session.flush()

    asgn1_b = Assignment(
        organization_id=org_b.id,
        complaint_id=c1_b.id,
        staff_id=staff_b.id,
        assigned_by_id=admin_b.id,
        status="ACTIVE",
        notes="Inspect door sensor alignment.",
        assigned_at=now - timedelta(hours=4),
    )
    u1_b = ComplaintUpdate(
        organization_id=org_b.id,
        complaint_id=c1_b.id,
        user_id=staff_b.id,
        status_from=ComplaintStatus.ASSIGNED,
        status_to=ComplaintStatus.IN_PROGRESS,
        remark="Staff Sarah Jenkins arrived on site and started diagnosis.",
        created_at=now - timedelta(hours=3),
    )
    db.session.add_all([asgn1_b, u1_b])

    db.session.commit()
    print("Database successfully seeded with 2 organizations (Apex Global University & Metro Institute of Health)!")


if __name__ == "__main__":
    from app import create_app
    app = create_app("development")
    with app.app_context():
        seed_database()
