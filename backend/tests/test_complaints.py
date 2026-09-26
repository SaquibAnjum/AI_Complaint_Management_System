"""Complaint submission and ownership unit tests."""

import unittest

from app import create_app
from app.extensions import db
from app.models.complaint import ComplaintStatus


class ComplaintTestCase(unittest.TestCase):
    """Test complaint filing, validation, editing and ownership."""

    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()

        self.app_context = self.app.app_context()
        self.app_context.push()

        db.create_all()

        # Create an organization and its admin.
        org_response = self.client.post(
            "/api/auth/register-organization",
            json={
                "organization_name": "Apex University",
                "organization_type": "University",
                "admin_name": "Admin User",
                "admin_email": "admin@apex.edu",
                "phone": "9999999999",
                "password": "password123",
                "confirm_password": "password123",
            },
        )

        self.assertEqual(org_response.status_code, 201)

        organization_data = org_response.get_json()["data"]

        self.join_code = organization_data["organization"]["join_code"]

        # Create Alice.
        alice_response = self.client.post(
            "/api/auth/register-user",
            json={
                "name": "Alice",
                "email": "alice@example.com",
                "password": "password123",
                "join_code": self.join_code,
            },
        )

        self.assertEqual(alice_response.status_code, 201)

        self.alice_token = alice_response.get_json()["data"]["token"]

        # Create Bob in the same organization.
        bob_response = self.client.post(
            "/api/auth/register-user",
            json={
                "name": "Bob",
                "email": "bob@example.com",
                "password": "password123",
                "join_code": self.join_code,
            },
        )

        self.assertEqual(bob_response.status_code, 201)

        self.bob_token = bob_response.get_json()["data"]["token"]

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_complaint_creation_and_ai_fallback(self):
        """Complaint submission should work even without AI configuration."""

        response = self.client.post(
            "/api/complaints",
            headers={
                "Authorization": f"Bearer {self.alice_token}"
            },
            json={
                "title": "Broken window in library section A",
                "description": (
                    "The window glass has a major crack and lets in "
                    "rain during storms."
                ),
            },
        )

        self.assertEqual(response.status_code, 201)

        data = response.get_json()["data"]["complaint"]

        self.assertEqual(
            data["status"],
            ComplaintStatus.PENDING,
        )

        self.assertIn("ai_status", data)
        self.assertIn("updates", data)
        self.assertGreater(len(data["updates"]), 0)

    def test_complaint_validation(self):
        """Invalid complaint data should be rejected."""

        response = self.client.post(
            "/api/complaints",
            headers={
                "Authorization": f"Bearer {self.alice_token}"
            },
            json={
                "title": "Short",
                "description": "Too short",
            },
        )

        self.assertEqual(response.status_code, 422)

    def test_ownership_enforcement(self):
        """Bob cannot view Alice's complaint."""

        # Alice creates a complaint.
        create_response = self.client.post(
            "/api/complaints",
            headers={
                "Authorization": f"Bearer {self.alice_token}"
            },
            json={
                "title": "Alice's private room issue",
                "description": (
                    "Water tap in room 101 is continuously leaking."
                ),
            },
        )

        self.assertEqual(create_response.status_code, 201)

        complaint_id = (
            create_response
            .get_json()["data"]["complaint"]["id"]
        )

        # Alice can access her own complaint.
        alice_response = self.client.get(
            f"/api/complaints/{complaint_id}",
            headers={
                "Authorization": f"Bearer {self.alice_token}"
            },
        )

        self.assertEqual(alice_response.status_code, 200)

        # Bob cannot access Alice's complaint.
        bob_response = self.client.get(
            f"/api/complaints/{complaint_id}",
            headers={
                "Authorization": f"Bearer {self.bob_token}"
            },
        )

        self.assertEqual(bob_response.status_code, 403)

        self.assertEqual(
            bob_response.get_json()["error"],
            "FORBIDDEN_COMPLAINT_ACCESS",
        )

    def test_edit_complaint_allowed_only_in_pending(self):
        """User can edit their complaint while it is PENDING."""

        create_response = self.client.post(
            "/api/complaints",
            headers={
                "Authorization": f"Bearer {self.alice_token}"
            },
            json={
                "title": "Initial Title for Grievance",
                "description": (
                    "Initial long description of the complaint issue here."
                ),
            },
        )

        self.assertEqual(create_response.status_code, 201)

        complaint_id = (
            create_response
            .get_json()["data"]["complaint"]["id"]
        )

        # Edit while PENDING.
        edit_response = self.client.put(
            f"/api/complaints/{complaint_id}",
            headers={
                "Authorization": f"Bearer {self.alice_token}"
            },
            json={
                "title": "Updated Title for Grievance",
                "description": (
                    "Updated detailed description of the complaint issue."
                ),
            },
        )

        self.assertEqual(edit_response.status_code, 200)

        self.assertEqual(
            edit_response
            .get_json()["data"]["complaint"]["title"],
            "Updated Title for Grievance",
        )


if __name__ == "__main__":
    unittest.main()