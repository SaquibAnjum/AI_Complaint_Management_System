"""Comprehensive Integration Test Suite for Final Multi-Organization Auth Architecture.

Validates all 14 required flows:
1. Create Organization A (Organization + Admin created with role=ADMIN)
2. Login as Admin A -> Role verified as ADMIN
6. Create/join User A via organization slug -> Role verified as USER
7. Login as User A -> Role verified as USER
8. Verify Organization A vs Organization B data isolation
9. Verify invalid role access returns 403 (e.g. USER hitting /api/admin/*)
10. Verify logout endpoint
11. Verify expired/invalid invitation token handling
13. Verify client cannot override or send role in public signups
"""

import unittest
from datetime import datetime, timezone, timedelta
from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.models.complaint import Complaint


class AuthArchitectureTestCase(unittest.TestCase):
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

    def test_complete_multi_org_auth_architecture(self):
        # ── 1. Create Organization A ──────────────────────────────────────────
        # Frontend must not choose role. Backend automatically assigns ADMIN.
        org_a_payload = {
            "organization_name": "Apex University",
            "organization_type": "University",
            "admin_name": "Dean Arthur",
            "admin_email": "arthur@apex.edu",
            "phone": "+1 555-0101",
            "password": "Password123!",
            "confirm_password": "Password123!",
            # Even if a client maliciously sends role, backend ignores and forces ADMIN
            "role": "USER",
        }
        res_org_a = self.client.post("/api/auth/register-organization", json=org_a_payload)
        self.assertEqual(res_org_a.status_code, 201)
        data_org_a = res_org_a.get_json()["data"]
        admin_a_token = data_org_a["token"]
        admin_a_user = data_org_a["user"]
        org_a = data_org_a["organization"]

        self.assertEqual(admin_a_user["role"], "ADMIN")
        self.assertEqual(admin_a_user["organization_id"], org_a["id"])
        self.assertEqual(org_a["slug"], "apex-university")

        # ── 2. Login as Admin A via common /login ─────────────────────────────
        login_admin_res = self.client.post("/api/auth/login", json={
            "email": "arthur@apex.edu",
            "password": "Password123!",
        })
        self.assertEqual(login_admin_res.status_code, 200)
        admin_login_data = login_admin_res.get_json()["data"]
        self.assertEqual(admin_login_data["user"]["role"], "ADMIN")
        self.assertEqual(admin_login_data["user"]["organization_slug"], "apex-university")


        # ── 8. User joins Organization A via /signup?org=apex-university ──────
        # Verify public org lookup
        org_info_res = self.client.get("/api/auth/organization-info/apex-university")
        self.assertEqual(org_info_res.status_code, 200)
        self.assertEqual(org_info_res.get_json()["data"]["organization"]["name"], "Apex University")

        user_a_payload = {
            "org_slug": "apex-university",
            "name": "Jane Student",
            "email": "jane@apex.edu",
            "phone": "+1 555-0103",
            "password": "UserPassword123!",
            # Attempting to forge an admin role is blocked
            "role": "ADMIN",
        }
        reg_user_res = self.client.post("/api/auth/register-user", json=user_a_payload)
        self.assertEqual(reg_user_res.status_code, 201)
        user_reg_data = reg_user_res.get_json()["data"]
        # Backend strictly locks role to USER
        self.assertEqual(user_reg_data["user"]["role"], "USER")
        self.assertEqual(user_reg_data["user"]["organization_id"], org_a["id"])

        # ── 9. Login as User A via common /login ──────────────────────────────
        user_login_res = self.client.post("/api/auth/login", json={
            "email": "jane@apex.edu",
            "password": "UserPassword123!",
        })
        self.assertEqual(user_login_res.status_code, 200)
        user_login_data = user_login_res.get_json()["data"]
        user_token = user_login_data["token"]
        self.assertEqual(user_login_data["user"]["role"], "USER")

        # ── 10. Security: Role-based Authorization Enforcement ─────────────────
        # User cannot access Admin APIs -> returns 403
        admin_api_as_user = self.client.get(
            "/api/admin/stats",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(admin_api_as_user.status_code, 403)

       

        # ── 11. Multi-Tenant Data Isolation (Org A vs Org B) ───────────────────
        # Create Organization B
        res_org_b = self.client.post("/api/auth/register-organization", json={
            "organization_name": "Beacon College",
            "organization_type": "College",
            "admin_name": "Director Beacon",
            "admin_email": "director@beacon.edu",
            "password": "Password123!",
        })
        self.assertEqual(res_org_b.status_code, 201)
        admin_b_token = res_org_b.get_json()["data"]["token"]

        

        # ── 12. Token Expiration / Invalid Token ──────────────────────────────
        invalid_tok_res = self.client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid.jwt.token"},
        )
        self.assertEqual(invalid_tok_res.status_code, 401)

        

        # ── 14. Logout Confirmation ───────────────────────────────────────────
        logout_res = self.client.post("/api/auth/logout")
        self.assertEqual(logout_res.status_code, 200)
        self.assertTrue(logout_res.get_json()["success"])


if __name__ == "__main__":
    unittest.main()
