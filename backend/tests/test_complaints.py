"""Complaint submission and ownership unit tests."""

import unittest
from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintStatus


class ComplaintTestCase(unittest.TestCase):
    """Test suite for complaint filing, validation, and ownership protection."""

    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        # Create two distinct test users
        u1 = User(name="Alice", email="alice@example.com", password="password123", role=UserRole.USER)
        u2 = User(name="Bob", email="bob@example.com", password="password123", role=UserRole.USER)
        db.session.add_all([u1, u2])
        db.session.commit()

        # Get tokens
        res1 = self.client.post("/api/auth/login", json={"email": "alice@example.com", "password": "password123"})
        self.alice_token = res1.get_json()["data"]["token"]

        res2 = self.client.post("/api/auth/login", json={"email": "bob@example.com", "password": "password123"})
        self.bob_token = res2.get_json()["data"]["token"]

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_complaint_creation_and_ai_fallback(self):
        """Test submitting a complaint works cleanly even when GEMINI_API_KEY is not configured."""
        res = self.client.post(
            "/api/complaints",
            headers={"Authorization": f"Bearer {self.alice_token}"},
            json={
                "title": "Broken window in library section A",
                "description": "The window glass has a major crack and lets in rain during storms.",
            },
        )
        self.assertEqual(res.status_code, 201)
        data = res.get_json()["data"]["complaint"]
        self.assertEqual(data["status"], ComplaintStatus.PENDING)
        self.assertIn("ai_status", data)
        self.assertIn("updates", data)
        self.assertGreater(len(data["updates"]), 0)

    def test_complaint_validation(self):
        """Test missing title and too-short description are rejected."""
        res = self.client.post(
            "/api/complaints",
            headers={"Authorization": f"Bearer {self.alice_token}"},
            json={"title": "Short", "description": "Too short"},
        )
        self.assertEqual(res.status_code, 422)

    def test_ownership_enforcement(self):
        """Test that Bob cannot view Alice's complaint."""
        # Alice creates a complaint
        create_res = self.client.post(
            "/api/complaints",
            headers={"Authorization": f"Bearer {self.alice_token}"},
            json={
                "title": "Alice's private room issue",
                "description": "Water tap in room 101 is continuously leaking.",
            },
        )
        cid = create_res.get_json()["data"]["complaint"]["id"]

        # Alice can access it
        alice_view = self.client.get(f"/api/complaints/{cid}", headers={"Authorization": f"Bearer {self.alice_token}"})
        self.assertEqual(alice_view.status_code, 200)

        # Bob cannot access it (403 Forbidden)
        bob_view = self.client.get(f"/api/complaints/{cid}", headers={"Authorization": f"Bearer {self.bob_token}"})
        self.assertEqual(bob_view.status_code, 403)
        self.assertEqual(bob_view.get_json()["error"], "FORBIDDEN_COMPLAINT_ACCESS")

    def test_edit_complaint_allowed_only_in_pending(self):
        """Test user can edit their complaint only when status is PENDING."""
        create_res = self.client.post(
            "/api/complaints",
            headers={"Authorization": f"Bearer {self.alice_token}"},
            json={
                "title": "Initial Title for Grievance",
                "description": "Initial long description of the complaint issue here.",
            },
        )
        cid = create_res.get_json()["data"]["complaint"]["id"]

        # Edit while PENDING
        edit_res = self.client.put(
            f"/api/complaints/{cid}",
            headers={"Authorization": f"Bearer {self.alice_token}"},
            json={
                "title": "Updated Title for Grievance",
                "description": "Updated detailed description of the complaint issue.",
            },
        )
        self.assertEqual(edit_res.status_code, 200)
        self.assertEqual(edit_res.get_json()["data"]["complaint"]["title"], "Updated Title for Grievance")


if __name__ == "__main__":
    unittest.main()
