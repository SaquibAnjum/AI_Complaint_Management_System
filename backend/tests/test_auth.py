"""Authentication and Authorization Tests."""

import unittest

from app import create_app
from app.extensions import db


class AuthTestCase(unittest.TestCase):
    """Test authentication, organization onboarding and JWT authorization."""

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

    def create_organization(self):
        """Create an organization with its initial ADMIN account."""

        response = self.client.post(
            "/api/auth/register-organization",
            json={
                "organization_name": "Apex University",
                "organization_type": "University",
                "admin_name": "Jane Admin",
                "admin_email": "jane@apex.edu",
                "phone": "9999999999",
                "password": "password123",
                "confirm_password": "password123",
            },
        )

        self.assertEqual(response.status_code, 201)

        return response.get_json()["data"]

    def test_organization_registration_success(self):
        """Organization registration creates an ADMIN account."""

        response = self.client.post(
            "/api/auth/register-organization",
            json={
                "organization_name": "Apex University",
                "organization_type": "University",
                "admin_name": "Jane Admin",
                "admin_email": "jane@apex.edu",
                "phone": "9999999999",
                "password": "password123",
                "confirm_password": "password123",
                # Backend should ignore any client-provided role.
                "role": "USER",
            },
        )

        self.assertEqual(response.status_code, 201)

        data = response.get_json()["data"]

        self.assertIn("token", data)
        self.assertEqual(data["user"]["email"], "jane@apex.edu")
        self.assertEqual(data["user"]["role"], "ADMIN")

        self.assertEqual(
            data["user"]["organization_id"],
            data["organization"]["id"],
        )

        self.assertEqual(
            data["organization"]["name"],
            "Apex University",
        )

        self.assertTrue(data["organization"]["join_code"])

    def test_user_registration_success(self):
        """A normal user can join an existing organization."""

        organization_data = self.create_organization()

        join_code = organization_data["organization"]["join_code"]

        response = self.client.post(
            "/api/auth/register-user",
            json={
                "name": "John User",
                "email": "john@apex.edu",
                "password": "password123",
                "join_code": join_code,
            },
        )

        self.assertEqual(response.status_code, 201)

        data = response.get_json()["data"]

        self.assertIn("token", data)
        self.assertEqual(data["user"]["name"], "John User")
        self.assertEqual(data["user"]["email"], "john@apex.edu")
        self.assertEqual(data["user"]["role"], "USER")

        self.assertEqual(
            data["user"]["organization_id"],
            organization_data["organization"]["id"],
        )

    def test_user_cannot_choose_admin_role(self):
        """User registration must always create a USER."""

        organization_data = self.create_organization()

        join_code = organization_data["organization"]["join_code"]

        response = self.client.post(
            "/api/auth/register-user",
            json={
                "name": "Normal User",
                "email": "normal@apex.edu",
                "password": "password123",
                "join_code": join_code,
                "role": "ADMIN",
            },
        )

        self.assertEqual(response.status_code, 201)

        data = response.get_json()["data"]

        self.assertEqual(data["user"]["role"], "USER")

    def test_duplicate_registration_fails(self):
        """Duplicate email should return 409."""

        organization_data = self.create_organization()

        join_code = organization_data["organization"]["join_code"]

        first_response = self.client.post(
            "/api/auth/register-user",
            json={
                "name": "John User",
                "email": "john@apex.edu",
                "password": "password123",
                "join_code": join_code,
            },
        )

        self.assertEqual(first_response.status_code, 201)

        duplicate_response = self.client.post(
            "/api/auth/register-user",
            json={
                "name": "Another User",
                "email": "john@apex.edu",
                "password": "password123",
                "join_code": join_code,
            },
        )

        self.assertEqual(duplicate_response.status_code, 409)

        self.assertEqual(
            duplicate_response.get_json()["error"],
            "EMAIL_ALREADY_EXISTS",
        )

    def test_user_registration_validation_errors(self):
        """Invalid user registration data should return 422."""

        organization_data = self.create_organization()

        join_code = organization_data["organization"]["join_code"]

        response = self.client.post(
            "/api/auth/register-user",
            json={
                "name": "J",
                "email": "not-an-email",
                "password": "123",
                "join_code": join_code,
            },
        )

        self.assertEqual(response.status_code, 422)

        data = response.get_json()

        self.assertFalse(data["success"])
        self.assertEqual(data["error"], "VALIDATION_ERROR")
        self.assertIn("errors", data["data"])

    def test_invalid_organization_fails(self):
        """Invalid organization ID should return 404."""

        response = self.client.post(
            "/api/auth/register-user",
            json={
                "name": "John User",
                "email": "john@example.com",
                "password": "password123",
                "join_code": "INVALID-CODE",
            },
        )

        self.assertEqual(response.status_code, 404)

        self.assertEqual(
            response.get_json()["error"],
            "ORGANIZATION_INVALID",
        )

    def test_login_success_and_failure(self):
        """Valid login should succeed and wrong password should fail."""

        self.create_organization()

        # Correct password
        response = self.client.post(
            "/api/auth/login",
            json={
                "email": "jane@apex.edu",
                "password": "password123",
            },
        )

        self.assertEqual(response.status_code, 200)

        data = response.get_json()["data"]

        self.assertIn("token", data)
        self.assertEqual(data["user"]["email"], "jane@apex.edu")
        self.assertEqual(data["user"]["role"], "ADMIN")

        # Incorrect password
        failed_response = self.client.post(
            "/api/auth/login",
            json={
                "email": "jane@apex.edu",
                "password": "wrongpassword",
            },
        )

        self.assertEqual(failed_response.status_code, 401)

        self.assertEqual(
            failed_response.get_json()["error"],
            "INVALID_CREDENTIALS",
        )

    def test_protected_me_endpoint(self):
        """The /me endpoint requires a valid JWT."""

        # Without JWT
        unauthenticated_response = self.client.get(
            "/api/auth/me"
        )

        self.assertEqual(
            unauthenticated_response.status_code,
            401,
        )

        # Create organization + admin
        organization_data = self.create_organization()

        token = organization_data["token"]

        # With JWT
        authenticated_response = self.client.get(
            "/api/auth/me",
            headers={
                "Authorization": f"Bearer {token}"
            },
        )

        self.assertEqual(
            authenticated_response.status_code,
            200,
        )

        data = authenticated_response.get_json()["data"]

        self.assertEqual(
            data["user"]["name"],
            "Jane Admin",
        )

        self.assertEqual(
            data["user"]["email"],
            "jane@apex.edu",
        )

        self.assertEqual(
            data["user"]["role"],
            "ADMIN",
        )

    def test_logout_endpoint(self):
        """Logout endpoint should return a successful response."""

        response = self.client.post(
            "/api/auth/logout"
        )

        self.assertEqual(response.status_code, 200)

        data = response.get_json()

        self.assertTrue(data["success"])


if __name__ == "__main__":
    unittest.main()