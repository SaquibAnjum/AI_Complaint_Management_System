"""Automated Test Suite for Multi-Organization Architecture using unittest."""

import unittest
from app import create_app
from app.extensions import db


class MultiTenancyTestCase(unittest.TestCase):
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
        """Test 1: Register Organization A with auto-generated Admin."""
        payload = {
            "organization_name": "Stanford Academy",
            "organization_type": "University",
            "admin_name": "Dean Stanford",
            "admin_email": "dean@stanford.edu",
            "phone": "+1 555-0111",
            "password": "password123",
            "confirm_password": "password123",
        }
        res = self.client.post("/api/auth/register-organization", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()["data"]
        self.assertIn("token", data)
        self.assertEqual(data["user"]["role"], "ADMIN")
        self.assertEqual(data["organization"]["slug"], "stanford-academy")
        self.assertEqual(data["user"]["organization_id"], data["organization"]["id"])

        # Test common login for Admin
        login_res = self.client.post("/api/auth/login", json={"email": "dean@stanford.edu", "password": "password123"})
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.get_json()["data"]
        self.assertEqual(login_data["user"]["role"], "ADMIN")
        self.assertEqual(login_data["user"]["organization_slug"], "stanford-academy")

    def test_cross_organization_isolation(self):
        """Test 2: Org A and Org B must be strictly isolated."""
        # Register Org A
        res_a = self.client.post("/api/auth/register-organization", json={
            "organization_name": "Alpha University",
            "organization_type": "University",
            "admin_name": "Admin Alpha",
            "admin_email": "admin@alpha.edu",
            "password": "password123",
        })
        self.assertEqual(res_a.status_code, 201)
        token_a = res_a.get_json()["data"]["token"]

        # Register Org B
        res_b = self.client.post("/api/auth/register-organization", json={
            "organization_name": "Beta College",
            "organization_type": "College",
            "admin_name": "Admin Beta",
            "admin_email": "admin@beta.edu",
            "password": "password123",
        })
        self.assertEqual(res_b.status_code, 201)
        token_b = res_b.get_json()["data"]["token"]

        # Create User in Org A
        user_a_res = self.client.post("/api/auth/register-user", json={
            "org_slug": "alpha-university",
            "name": "User Alpha",
            "email": "user@alpha.edu",
            "password": "password123",
        })
        self.assertEqual(user_a_res.status_code, 201)
        token_user_a = user_a_res.get_json()["data"]["token"]

        # User A files complaint in Org A
        comp_res = self.client.post("/api/complaints", headers={"Authorization": f"Bearer {token_user_a}"}, json={
            "title": "Alpha campus broken lamp in hall 1",
            "description": "The lamp post outside the chemistry lab is broken and unlit.",
            "category": "Infrastructure",
        })
        self.assertEqual(comp_res.status_code, 201)
        complaint_id = comp_res.get_json()["data"]["complaint"]["id"]

        # Admin A sees complaint
        list_a = self.client.get("/api/admin/complaints", headers={"Authorization": f"Bearer {token_a}"})
        self.assertEqual(list_a.status_code, 200)
        self.assertEqual(len(list_a.get_json()["data"]["complaints"]), 1)

        # Admin B CANNOT see Org A complaint
        list_b = self.client.get("/api/admin/complaints", headers={"Authorization": f"Bearer {token_b}"})
        self.assertEqual(list_b.status_code, 200)
        self.assertEqual(len(list_b.get_json()["data"]["complaints"]), 0)

        # Admin B CANNOT access Org A complaint directly
        detail_b = self.client.get(f"/api/admin/complaints/{complaint_id}", headers={"Authorization": f"Bearer {token_b}"})
        self.assertEqual(detail_b.status_code, 404)

        # Stats isolation: Admin B stats show 0 complaints
        stats_b = self.client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token_b}"})
        self.assertEqual(stats_b.status_code, 200)
        self.assertEqual(stats_b.get_json()["data"]["summary"]["total"], 0)

    def test_staff_onboarding_and_activation_flow(self):
        """Test 3: Admin creates staff -> activation token -> password set -> common login."""
        # Org setup
        reg = self.client.post("/api/auth/register-organization", json={
            "organization_name": "Gamma Medical",
            "organization_type": "Hospital",
            "admin_name": "Director Gamma",
            "admin_email": "director@gamma.med",
            "password": "password123",
        })
        admin_token = reg.get_json()["data"]["token"]

        # Admin creates Staff
        staff_create_res = self.client.post("/api/admin/staff", headers={"Authorization": f"Bearer {admin_token}"}, json={
            "name": "Dr. Sarah Conner",
            "email": "sarah@gamma.med",
            "phone": "+1 555-0999",
            "department": "Maintenance",
            "designation": "Equipment Specialist",
        })
        self.assertEqual(staff_create_res.status_code, 201)
        create_data = staff_create_res.get_json()["data"]
        token = create_data["activation_token"]
        self.assertIsNotNone(token)

        # Verify invitation info
        verify_res = self.client.get(f"/api/auth/verify-invitation/{token}")
        self.assertEqual(verify_res.status_code, 200)
        self.assertEqual(verify_res.get_json()["data"]["user_name"], "Dr. Sarah Conner")
        self.assertEqual(verify_res.get_json()["data"]["organization_name"], "Gamma Medical")

        # Staff activates account by setting password
        activate_res = self.client.post("/api/auth/activate-staff", json={
            "token": token,
            "password": "staffPassword123",
            "confirm_password": "staffPassword123",
        })
        self.assertEqual(activate_res.status_code, 200)

        # Staff uses common login
        login_res = self.client.post("/api/auth/login", json={
            "email": "sarah@gamma.med",
            "password": "staffPassword123",
        })
        self.assertEqual(login_res.status_code, 200)
        staff_login_data = login_res.get_json()["data"]
        self.assertEqual(staff_login_data["user"]["role"], "STAFF")
        self.assertEqual(staff_login_data["user"]["organization_slug"], "gamma-medical")

        # Second attempt to use invitation MUST fail
        reuse_res = self.client.post("/api/auth/activate-staff", json={
            "token": token,
            "password": "newPassword999",
        })
        self.assertEqual(reuse_res.status_code, 400)

    def test_complaint_status_synchronization_and_audit(self):
        """Test 6: Status flow PENDING -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CONFIRMED."""
        # Setup Org
        reg = self.client.post("/api/auth/register-organization", json={
            "organization_name": "Delta Tech",
            "organization_type": "Company",
            "admin_name": "Admin Delta",
            "admin_email": "admin@delta.io",
            "password": "password123",
        })
        admin_token = reg.get_json()["data"]["token"]

        # Setup Staff
        s_res = self.client.post("/api/admin/staff", headers={"Authorization": f"Bearer {admin_token}"}, json={
            "name": "Engineer Dave",
            "email": "dave@delta.io",
            "department": "IT Support",
        })
        raw_token = s_res.get_json()["data"]["activation_token"]
        staff_id = s_res.get_json()["data"]["staff"]["id"]
        self.client.post("/api/auth/activate-staff", json={"token": raw_token, "password": "davePassword123"})
        staff_token = self.client.post("/api/auth/login", json={"email": "dave@delta.io", "password": "davePassword123"}).get_json()["data"]["token"]

        # Setup User
        u_res = self.client.post("/api/auth/register-user", json={
            "org_slug": "delta-tech",
            "name": "User Dave",
            "email": "user.dave@delta.io",
            "password": "userPassword123",
        })
        user_token = u_res.get_json()["data"]["token"]

        # User submits complaint
        comp_res = self.client.post("/api/complaints", headers={"Authorization": f"Bearer {user_token}"}, json={
            "title": "Server room temperature alert",
            "description": "HVAC sensor reporting 85 degrees Fahrenheit in rack room 2.",
            "category": "IT Support",
        })
        complaint_id = comp_res.get_json()["data"]["complaint"]["id"]

        # Admin assigns to staff
        assign_res = self.client.put(f"/api/admin/complaints/{complaint_id}/assign", headers={"Authorization": f"Bearer {admin_token}"}, json={
            "staff_id": staff_id,
            "notes": "Please check cooling unit.",
        })
        self.assertEqual(assign_res.status_code, 200)
        self.assertEqual(assign_res.get_json()["data"]["complaint"]["status"], "ASSIGNED")

        # Staff transitions to IN_PROGRESS
        prog_res = self.client.put(f"/api/staff/complaints/{complaint_id}/status", headers={"Authorization": f"Bearer {staff_token}"}, json={
            "status": "IN_PROGRESS",
            "remark": "Replacing faulty thermocouple.",
        })
        self.assertEqual(prog_res.status_code, 200)
        self.assertEqual(prog_res.get_json()["data"]["complaint"]["status"], "IN_PROGRESS")

        # Staff marks RESOLVED
        res_comp = self.client.put(f"/api/staff/complaints/{complaint_id}/resolve", headers={"Authorization": f"Bearer {staff_token}"}, json={
            "notes": "Cooling unit restored to 68 degrees.",
        })
        self.assertEqual(res_comp.status_code, 200)
        self.assertEqual(res_comp.get_json()["data"]["complaint"]["status"], "RESOLVED")

        # User confirms resolution
        conf_res = self.client.post(f"/api/complaints/{complaint_id}/confirm", headers={"Authorization": f"Bearer {user_token}"})
        self.assertEqual(conf_res.status_code, 200)
        self.assertEqual(conf_res.get_json()["data"]["complaint"]["status"], "CONFIRMED")

        # Audit history timeline verification
        details = self.client.get(f"/api/complaints/{complaint_id}", headers={"Authorization": f"Bearer {user_token}"})
        self.assertEqual(details.status_code, 200)
        updates = details.get_json()["data"]["complaint"]["updates"]
        self.assertGreaterEqual(len(updates), 4)

    def test_unauthorized_role_access(self):
        """Test 7: Standard user cannot access Admin endpoints."""
        reg = self.client.post("/api/auth/register-organization", json={
            "organization_name": "Omega Institute",
            "organization_type": "Institution",
            "admin_name": "Admin Omega",
            "admin_email": "admin@omega.org",
            "password": "password123",
        })
        u_res = self.client.post("/api/auth/register-user", json={
            "org_slug": "omega-institute",
            "name": "User Omega",
            "email": "user@omega.org",
            "password": "password123",
        })
        user_token = u_res.get_json()["data"]["token"]

        # User attempts to call GET /api/admin/users -> must return 403 Forbidden
        admin_access = self.client.get("/api/admin/users", headers={"Authorization": f"Bearer {user_token}"})
        self.assertEqual(admin_access.status_code, 403)


if __name__ == "__main__":
    unittest.main()
