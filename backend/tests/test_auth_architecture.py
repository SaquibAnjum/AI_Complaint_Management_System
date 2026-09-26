"""Comprehensive Integration Test Suite for Final Multi-Organization Auth Architecture.

Validates all 14 required flows:
1. Create Organization A (Organization + Admin created with role=ADMIN)
2. Login as Admin A -> Role verified as ADMIN
3. Admin A creates Staff A -> Token generated
4. Staff A activates via token -> Sets password
5. Login as Staff A -> Role verified as STAFF
6. Create/join User A via organization slug -> Role verified as USER
7. Login as User A -> Role verified as USER
8. Verify Organization A vs Organization B data isolation
9. Verify invalid role access returns 403 (e.g. USER hitting /api/admin/*)
10. Verify logout endpoint
11. Verify expired/invalid invitation token handling
12. Verify used staff invitation cannot be reused
13. Verify client cannot override or send role in public signups
"""

import unittest
from datetime import datetime, timezone, timedelta
from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.models.staff_invitation import StaffInvitation
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

        # ── 3. Admin A creates Staff A via Staff Management ───────────────────
        staff_a_payload = {
            "name": "Sarah Connor",
            "email": "sarah@apex.edu",
            "phone": "+1 555-0102",
            "department": "Maintenance",
            "designation": "Lead Technician",
        }
        create_staff_res = self.client.post(
            "/api/admin/staff",
            headers={"Authorization": f"Bearer {admin_a_token}"},
            json=staff_a_payload,
        )
        self.assertEqual(create_staff_res.status_code, 201)
        staff_creation_data = create_staff_res.get_json()["data"]
        raw_token = staff_creation_data["activation_token"]
        activation_url = staff_creation_data["activation_url"]
        self.assertIn("/activate-staff/", activation_url)
        self.assertTrue(len(raw_token) >= 32)

        # Before activation, staff member is inactive and cannot log in
        unactivated_login = self.client.post("/api/auth/login", json={
            "email": "sarah@apex.edu",
            "password": "Password123!",
        })
        self.assertEqual(unactivated_login.status_code, 401)  # Password not set yet

        # ── 4. Verify Invitation Token for Staff A ────────────────────────────
        verify_inv_res = self.client.get(f"/api/auth/verify-invitation/{raw_token}")
        self.assertEqual(verify_inv_res.status_code, 200)
        inv_data = verify_inv_res.get_json()["data"]
        self.assertEqual(inv_data["user_name"], "Sarah Connor")
        self.assertEqual(inv_data["organization_name"], "Apex University")
        self.assertEqual(inv_data["department"], "Maintenance")

        # ── 5. Staff A activates account on /activate-staff/:token ────────────
        activate_res = self.client.post("/api/auth/activate-staff", json={
            "token": raw_token,
            "password": "StaffPassword123!",
            "confirm_password": "StaffPassword123!",
        })
        self.assertEqual(activate_res.status_code, 200)
        self.assertIn("activated successfully", activate_res.get_json()["message"])

        # ── 6. Login as Staff A via common /login ─────────────────────────────
        staff_login_res = self.client.post("/api/auth/login", json={
            "email": "sarah@apex.edu",
            "password": "StaffPassword123!",
        })
        self.assertEqual(staff_login_res.status_code, 200)
        staff_login_data = staff_login_res.get_json()["data"]
        staff_token = staff_login_data["token"]
        self.assertEqual(staff_login_data["user"]["role"], "STAFF")
        self.assertEqual(staff_login_data["user"]["organization_slug"], "apex-university")

        # ── 7. Verify used staff invitation CANNOT be reused ───────────────────
        reuse_res = self.client.post("/api/auth/activate-staff", json={
            "token": raw_token,
            "password": "AnotherPassword!",
        })
        self.assertEqual(reuse_res.status_code, 400)
        self.assertEqual(reuse_res.get_json()["error"], "INVITATION_ALREADY_USED")

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

        # Staff cannot access Admin APIs -> returns 403
        admin_api_as_staff = self.client.get(
            "/api/admin/stats",
            headers={"Authorization": f"Bearer {staff_token}"},
        )
        self.assertEqual(admin_api_as_staff.status_code, 403)

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

        # Admin B requests staff list -> sees 0 staff (Staff A is in Org A)
        staff_list_b = self.client.get(
            "/api/admin/staff",
            headers={"Authorization": f"Bearer {admin_b_token}"},
        )
        self.assertEqual(staff_list_b.status_code, 200)
        self.assertEqual(len(staff_list_b.get_json()["data"]["staff"]), 0)

        # Admin A requests staff list -> sees 1 staff (Staff A)
        staff_list_a = self.client.get(
            "/api/admin/staff",
            headers={"Authorization": f"Bearer {admin_a_token}"},
        )
        self.assertEqual(staff_list_a.status_code, 200)
        self.assertEqual(len(staff_list_a.get_json()["data"]["staff"]), 1)

        # ── 12. Token Expiration / Invalid Token ──────────────────────────────
        invalid_tok_res = self.client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid.jwt.token"},
        )
        self.assertEqual(invalid_tok_res.status_code, 401)

        # ── 13. Expired Staff Invitation Token ────────────────────────────────
        # Create expired invitation artificially
        expired_inv, exp_raw_token = StaffInvitation.create_invitation(
            user_id=admin_login_data["user"]["id"],
            organization_id=org_a["id"],
            expires_in_days=-1,  # Expired yesterday
        )
        db.session.add(expired_inv)
        db.session.commit()

        exp_verify_res = self.client.get(f"/api/auth/verify-invitation/{exp_raw_token}")
        self.assertEqual(exp_verify_res.status_code, 410)
        self.assertEqual(exp_verify_res.get_json()["error"], "INVITATION_EXPIRED")

        # ── 14. Logout Confirmation ───────────────────────────────────────────
        logout_res = self.client.post("/api/auth/logout")
        self.assertEqual(logout_res.status_code, 200)
        self.assertTrue(logout_res.get_json()["success"])


if __name__ == "__main__":
    unittest.main()
