"""Authentication and Authorization Unit Tests."""

import unittest
from app import create_app
from app.extensions import db
from app.models.user import User, UserRole


class AuthTestCase(unittest.TestCase):
    """Test suite for authentication endpoints and role access control."""

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

    def test_user_registration_success(self):
        """Test successful registration of a standard user."""
        res = self.client.post("/api/auth/register", json={
            "name": "Jane Doe",
            "email": "jane@example.com",
            "password": "password123",
            "role": "USER",
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("token", data["data"])
        self.assertEqual(data["data"]["user"]["email"], "jane@example.com")
        self.assertEqual(data["data"]["user"]["role"], "USER")

    def test_duplicate_registration_fails(self):
        """Test that registering an existing email returns 409 Conflict."""
        payload = {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "password": "password123",
        }
        self.client.post("/api/auth/register", json=payload)
        res = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res.status_code, 409)
        self.assertEqual(res.get_json()["error"], "EMAIL_ALREADY_EXISTS")

    def test_registration_validation_errors(self):
        """Test registration validation rules (short password, invalid email)."""
        res = self.client.post("/api/auth/register", json={
            "name": "J",
            "email": "not-an-email",
            "password": "123",
        })
        self.assertEqual(res.status_code, 422)
        self.assertIn("errors", res.get_json()["data"])

    def test_login_success_and_failure(self):
        """Test valid login vs invalid credentials."""
        self.client.post("/api/auth/register", json={
            "name": "Jane Doe",
            "email": "jane@example.com",
            "password": "password123",
        })

        # Correct password
        res = self.client.post("/api/auth/login", json={
            "email": "jane@example.com",
            "password": "password123",
        })
        self.assertEqual(res.status_code, 200)
        self.assertIn("token", res.get_json()["data"])

        # Incorrect password
        fail_res = self.client.post("/api/auth/login", json={
            "email": "jane@example.com",
            "password": "wrongpassword",
        })
        self.assertEqual(fail_res.status_code, 401)
        self.assertEqual(fail_res.get_json()["error"], "INVALID_CREDENTIALS")

    def test_protected_me_endpoint(self):
        """Test accessing /api/auth/me with and without token."""
        # Unauthenticated
        unauth = self.client.get("/api/auth/me")
        self.assertEqual(unauth.status_code, 401)

        # Authenticated
        reg = self.client.post("/api/auth/register", json={
            "name": "Jane Doe",
            "email": "jane@example.com",
            "password": "password123",
        })
        token = reg.get_json()["data"]["token"]

        me = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.get_json()["data"]["user"]["name"], "Jane Doe")


if __name__ == "__main__":
    unittest.main()
