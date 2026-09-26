"""Automated Test Suite for Multi-Organization Architecture using unittest."""

import unittest

from app import create_app
from app.extensions import db


class MultiTenancyTestCase(unittest.TestCase):
    """Test organization isolation, admin access and complaint workflow."""

    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()

        self.app_context = self.app.app_context()
        self.app_context.push()

        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_organization_and_admin_registration(self):
        """Test 1: Register organization with auto-generated admin."""

        payload = {
            "organization_name": "Stanford Academy",
            "organization_type": "University",
            "admin_name": "Dean Stanford",
            "admin_email": "dean@stanford.edu",
            "phone": "+1 555-0111",
            "password": "password123",
            "confirm_password": "password123",
        }

        response = self.client.post(
            "/api/auth/register-organization",
            json=payload,
        )

        self.assertEqual(response.status_code, 201)

        data = response.get_json()["data"]

        self.assertIn("token", data)
        self.assertEqual(data["user"]["role"], "ADMIN")
        self.assertEqual(
            data["organization"]["slug"],
            "stanford-academy",
        )
        self.assertEqual(
            data["user"]["organization_id"],
            data["organization"]["id"],
        )

        # Verify common login for admin.
        login_response = self.client.post(
            "/api/auth/login",
            json={
                "email": "dean@stanford.edu",
                "password": "password123",
            },
        )

        self.assertEqual(login_response.status_code, 200)

        login_data = login_response.get_json()["data"]

        self.assertEqual(login_data["user"]["role"], "ADMIN")
        self.assertEqual(
            login_data["user"]["organization_slug"],
            "stanford-academy",
        )

    def test_cross_organization_isolation(self):
        """Test 2: Organizations must be strictly isolated."""

        # Register Organization A.
        response_a = self.client.post(
            "/api/auth/register-organization",
            json={
                "organization_name": "Alpha University",
                "organization_type": "University",
                "admin_name": "Admin Alpha",
                "admin_email": "admin@alpha.edu",
                "password": "password123",
            },
        )

        self.assertEqual(response_a.status_code, 201)

        token_a = response_a.get_json()["data"]["token"]

        # Register Organization B.
        response_b = self.client.post(
            "/api/auth/register-organization",
            json={
                "organization_name": "Beta College",
                "organization_type": "College",
                "admin_name": "Admin Beta",
                "admin_email": "admin@beta.edu",
                "password": "password123",
            },
        )

        self.assertEqual(response_b.status_code, 201)

        token_b = response_b.get_json()["data"]["token"]

        # Create a normal user in Organization A.
        user_response = self.client.post(
            "/api/auth/register-user",
            json={
                "org_slug": "alpha-university",
                "name": "User Alpha",
                "email": "user@alpha.edu",
                "password": "password123",
            },
        )

        self.assertEqual(user_response.status_code, 201)

        user_token = user_response.get_json()["data"]["token"]

        # User A files a complaint in Organization A.
        complaint_response = self.client.post(
            "/api/complaints",
            headers={
                "Authorization": f"Bearer {user_token}"
            },
            json={
                "title": "Alpha campus broken lamp in hall 1",
                "description": (
                    "The lamp post outside the chemistry lab "
                    "is broken and unlit."
                ),
                "category": "Infrastructure",
            },
        )

        self.assertEqual(complaint_response.status_code, 201)

        complaint_id = (
            complaint_response
            .get_json()["data"]["complaint"]["id"]
        )

        # Admin A should see the complaint.
        list_a = self.client.get(
            "/api/admin/complaints",
            headers={
                "Authorization": f"Bearer {token_a}"
            },
        )

        self.assertEqual(list_a.status_code, 200)
        self.assertEqual(
            len(list_a.get_json()["data"]["complaints"]),
            1,
        )

        # Admin B should NOT see Organization A's complaint.
        list_b = self.client.get(
            "/api/admin/complaints",
            headers={
                "Authorization": f"Bearer {token_b}"
            },
        )

        self.assertEqual(list_b.status_code, 200)
        self.assertEqual(
            len(list_b.get_json()["data"]["complaints"]),
            0,
        )

        # Admin B should NOT access Organization A's complaint directly.
        detail_b = self.client.get(
            f"/api/admin/complaints/{complaint_id}",
            headers={
                "Authorization": f"Bearer {token_b}"
            },
        )

        self.assertEqual(detail_b.status_code, 404)

        # Admin B's statistics must remain isolated.
        stats_b = self.client.get(
            "/api/admin/stats",
            headers={
                "Authorization": f"Bearer {token_b}"
            },
        )

        self.assertEqual(stats_b.status_code, 200)
        self.assertEqual(
            stats_b.get_json()["data"]["summary"]["total"],
            0,
        )

    def test_complaint_status_synchronization_and_audit(self):
        """Test admin-managed complaint status flow and audit history."""

        # Register organization and admin.
        registration = self.client.post(
            "/api/auth/register-organization",
            json={
                "organization_name": "Delta Tech",
                "organization_type": "Company",
                "admin_name": "Admin Delta",
                "admin_email": "admin@delta.io",
                "password": "password123",
            },
        )

        self.assertEqual(registration.status_code, 201)

        admin_token = registration.get_json()["data"]["token"]

        # Register a normal user in the same organization.
        user_response = self.client.post(
            "/api/auth/register-user",
            json={
                "org_slug": "delta-tech",
                "name": "User Dave",
                "email": "user.dave@delta.io",
                "password": "userPassword123",
            },
        )

        self.assertEqual(user_response.status_code, 201)

        user_token = user_response.get_json()["data"]["token"]

        # User submits complaint.
        complaint_response = self.client.post(
            "/api/complaints",
            headers={
                "Authorization": f"Bearer {user_token}"
            },
            json={
                "title": "Server room temperature alert",
                "description": (
                    "HVAC sensor reporting 85 degrees Fahrenheit "
                    "in rack room 2."
                ),
                "category": "IT Support",
            },
        )

        self.assertEqual(complaint_response.status_code, 201)

        complaint_data = complaint_response.get_json()["data"]["complaint"]
        complaint_id = complaint_data["id"]

        # Complaint must initially be PENDING.
        self.assertEqual(
            complaint_data["status"],
            "PENDING",
        )

        # Admin moves complaint to UNDER_REVIEW.
        review_response = self.client.put(
            f"/api/admin/complaints/{complaint_id}/review",
            headers={
                "Authorization": f"Bearer {admin_token}"
            },
        )

        self.assertEqual(review_response.status_code, 200)
        self.assertEqual(
            review_response.get_json()["data"]["complaint"]["status"],
            "UNDER_REVIEW",
        )

        # Admin moves complaint to IN_PROGRESS.
        progress_response = self.client.put(
            f"/api/admin/complaints/{complaint_id}/status",
            headers={
                "Authorization": f"Bearer {admin_token}"
            },
            json={
                "status": "IN_PROGRESS",
                "remark": "Administrator started working on the issue.",
            },
        )

        self.assertEqual(progress_response.status_code, 200)
        self.assertEqual(
            progress_response.get_json()["data"]["complaint"]["status"],
            "IN_PROGRESS",
        )

        # Admin moves complaint to RESOLVED.
        resolve_response = self.client.put(
            f"/api/admin/complaints/{complaint_id}/status",
            headers={
                "Authorization": f"Bearer {admin_token}"
            },
            json={
                "status": "RESOLVED",
                "remark": "Issue has been resolved by the administrator.",
            },
        )

        self.assertEqual(resolve_response.status_code, 200)
        self.assertEqual(
            resolve_response.get_json()["data"]["complaint"]["status"],
            "RESOLVED",
        )

        # User confirms the resolution.
        confirm_response = self.client.post(
            f"/api/complaints/{complaint_id}/confirm",
            headers={
                "Authorization": f"Bearer {user_token}"
            },
        )

        self.assertEqual(confirm_response.status_code, 200)
        self.assertEqual(
            confirm_response.get_json()["data"]["complaint"]["status"],
            "CONFIRMED",
        )

        # Verify audit history.
        details_response = self.client.get(
            f"/api/complaints/{complaint_id}",
            headers={
                "Authorization": f"Bearer {user_token}"
            },
        )

        self.assertEqual(details_response.status_code, 200)

        complaint_details = (
            details_response
            .get_json()["data"]["complaint"]
        )

        updates = complaint_details["updates"]

        # Initial submission
        # + UNDER_REVIEW
        # + IN_PROGRESS
        # + RESOLVED
        # + CONFIRMED
        self.assertGreaterEqual(len(updates), 5)

    def test_unauthorized_role_access(self):
        """Test 4: Standard user cannot access admin endpoints."""

        # Register organization and admin.
        registration = self.client.post(
            "/api/auth/register-organization",
            json={
                "organization_name": "Omega Institute",
                "organization_type": "Institution",
                "admin_name": "Admin Omega",
                "admin_email": "admin@omega.org",
                "password": "password123",
            },
        )

        self.assertEqual(registration.status_code, 201)

        # Register normal user.
        user_response = self.client.post(
            "/api/auth/register-user",
            json={
                "org_slug": "omega-institute",
                "name": "User Omega",
                "email": "user@omega.org",
                "password": "password123",
            },
        )

        self.assertEqual(user_response.status_code, 201)

        user_token = user_response.get_json()["data"]["token"]

        # User must not access admin endpoints.
        admin_access = self.client.get(
            "/api/admin/users",
            headers={
                "Authorization": f"Bearer {user_token}"
            },
        )

        self.assertEqual(admin_access.status_code, 403)


if __name__ == "__main__":
    unittest.main()
