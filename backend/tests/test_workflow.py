"""End-to-End Complaint Lifecycle and Role-Based Workflow Tests."""

import unittest
from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
from app.models.complaint import ComplaintStatus


class WorkflowTestCase(unittest.TestCase):
    """Full lifecycle workflow: Filing -> AI -> Admin Review -> Staff Work -> Resolution -> Reject -> Reopen -> Confirm -> Feedback."""

    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        # Seed roles
        self.admin = User(name="Administrator", email="admin@test.com", password="password123", role=UserRole.ADMIN)
        self.staff = User(name="Technician Mike", email="staff@test.com", password="password123", role=UserRole.STAFF)
        self.student = User(name="Student Sam", email="sam@test.com", password="password123", role=UserRole.USER)
        db.session.add_all([self.admin, self.staff, self.student])
        db.session.commit()

        # Tokens
        def get_tok(email):
            r = self.client.post("/api/auth/login", json={"email": email, "password": "password123"})
            return r.get_json()["data"]["token"]

        self.admin_tok = get_tok("admin@test.com")
        self.staff_tok = get_tok("staff@test.com")
        self.student_tok = get_tok("sam@test.com")

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_full_lifecycle_workflow(self):
        """Execute complete complaint workflow through all user roles."""
        # 1. Student submits complaint
        sub_res = self.client.post(
            "/api/complaints",
            headers={"Authorization": f"Bearer {self.student_tok}"},
            json={
                "title": "Air conditioning unit leaking water in Lab 3",
                "description": "The AC unit in Lab 3 is leaking water over computer desks, creating an electrical hazard.",
            },
        )
        self.assertEqual(sub_res.status_code, 201)
        cid = sub_res.get_json()["data"]["complaint"]["id"]

        # 2. Admin marks Under Review
        rev_res = self.client.put(
            f"/api/admin/complaints/{cid}/review",
            headers={"Authorization": f"Bearer {self.admin_tok}"},
        )
        self.assertEqual(rev_res.status_code, 200)
        self.assertEqual(rev_res.get_json()["data"]["complaint"]["status"], ComplaintStatus.UNDER_REVIEW)

        # 3. Admin overrides classification
        class_res = self.client.put(
            f"/api/admin/complaints/{cid}/classification",
            headers={"Authorization": f"Bearer {self.admin_tok}"},
            json={
                "category": "Infrastructure",
                "priority": "CRITICAL",
                "department": "Maintenance",
            },
        )
        self.assertEqual(class_res.status_code, 200)
        self.assertEqual(class_res.get_json()["data"]["complaint"]["priority"], "CRITICAL")

        # 4. Admin assigns to staff
        assign_res = self.client.put(
            f"/api/admin/complaints/{cid}/assign",
            headers={"Authorization": f"Bearer {self.admin_tok}"},
            json={"staff_id": self.staff.id, "notes": "Attend immediately, power hazard"},
        )
        self.assertEqual(assign_res.status_code, 200)
        self.assertEqual(assign_res.get_json()["data"]["complaint"]["status"], ComplaintStatus.ASSIGNED)

        # 5. Staff starts work
        status_res = self.client.put(
            f"/api/staff/complaints/{cid}/status",
            headers={"Authorization": f"Bearer {self.staff_tok}"},
            json={"status": "IN_PROGRESS", "remark": "Disconnected power and commenced drainage pipe cleaning."},
        )
        self.assertEqual(status_res.status_code, 200)
        self.assertEqual(status_res.get_json()["data"]["complaint"]["status"], ComplaintStatus.IN_PROGRESS)

        # 6. Staff logs progress update
        upd_res = self.client.post(
            f"/api/staff/complaints/{cid}/updates",
            headers={"Authorization": f"Bearer {self.staff_tok}"},
            json={"remark": "Replaced clogged condensation hose."},
        )
        self.assertEqual(upd_res.status_code, 201)

        # 7. Staff resolves
        res_res = self.client.put(
            f"/api/staff/complaints/{cid}/resolve",
            headers={"Authorization": f"Bearer {self.staff_tok}"},
            json={"notes": "Cleaned filter and re-routed drainage pipe securely outside."},
        )
        self.assertEqual(res_res.status_code, 200)
        self.assertEqual(res_res.get_json()["data"]["complaint"]["status"], ComplaintStatus.RESOLVED)

        # 8. Student rejects resolution (test reject & reopen)
        rej_res = self.client.post(
            f"/api/complaints/{cid}/reject",
            headers={"Authorization": f"Bearer {self.student_tok}"},
            json={"reason": "Water still dripping slowly from left vent"},
        )
        self.assertEqual(rej_res.status_code, 200)
        self.assertEqual(rej_res.get_json()["data"]["complaint"]["status"], ComplaintStatus.REOPENED)

        # 9. Staff re-resolves
        res2_res = self.client.put(
            f"/api/staff/complaints/{cid}/resolve",
            headers={"Authorization": f"Bearer {self.staff_tok}"},
            json={"notes": "Tightened secondary internal seal. No drips observed over 1 hour."},
        )
        self.assertEqual(res2_res.status_code, 200)
        self.assertEqual(res2_res.get_json()["data"]["complaint"]["status"], ComplaintStatus.RESOLVED)

        # 10. Student confirms resolution
        conf_res = self.client.post(
            f"/api/complaints/{cid}/confirm",
            headers={"Authorization": f"Bearer {self.student_tok}"},
        )
        self.assertEqual(conf_res.status_code, 200)
        self.assertEqual(conf_res.get_json()["data"]["complaint"]["status"], ComplaintStatus.CONFIRMED)

        # 11. Student submits rating & feedback
        fb_res = self.client.post(
            f"/api/complaints/{cid}/feedback",
            headers={"Authorization": f"Bearer {self.student_tok}"},
            json={"rating": 5, "comment": "Excellent follow-up and prompt fix!"},
        )
        self.assertEqual(fb_res.status_code, 201)
        self.assertEqual(fb_res.get_json()["data"]["feedback"]["rating"], 5)

        # 12. Duplicate feedback should be rejected
        dup_fb = self.client.post(
            f"/api/complaints/{cid}/feedback",
            headers={"Authorization": f"Bearer {self.student_tok}"},
            json={"rating": 4, "comment": "Trying duplicate"},
        )
        self.assertEqual(dup_fb.status_code, 409)


if __name__ == "__main__":
    unittest.main()
