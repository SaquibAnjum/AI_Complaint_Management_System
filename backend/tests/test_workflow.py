"""End-to-End Complaint Lifecycle and Role-Based Workflow Tests."""

import unittest

from app import create_app
from app.extensions import db
from app.models.complaint import ComplaintStatus


class WorkflowTestCase(unittest.TestCase):
    """
    Full complaint lifecycle using the current ADMIN + USER architecture.

    Workflow:
    Filing -> AI Analysis -> Admin Review -> Classification Override
    -> In Progress -> Resolution -> Reject/Reopen
    -> Re-resolution -> User Confirmation -> Feedback
    """

    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()

        self.app_context = self.app.app_context()
        self.app_context.push()

        db.create_all()

        # ---------------------------------------------------------
        # Create organization and admin through the real API flow.
        # ---------------------------------------------------------
        admin_response = self.client.post(
            "/api/auth/register-organization",
            json={
                "organization_name": "Workflow University",
                "organization_type": "University",
                "admin_name": "Administrator",
                "admin_email": "admin@workflow.edu",
                "password": "password123",
            },
        )

        self.assertEqual(admin_response.status_code, 201)

        self.admin_tok = admin_response.get_json()["data"]["token"]

        # ---------------------------------------------------------
        # Create normal user through the real API flow.
        # ---------------------------------------------------------
        user_response = self.client.post(
            "/api/auth/register-user",
            json={
                "org_slug": "workflow-university",
                "name": "Student Sam",
                "email": "sam@workflow.edu",
                "password": "password123",
            },
        )

        self.assertEqual(user_response.status_code, 201)

        self.student_tok = user_response.get_json()["data"]["token"]

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_full_lifecycle_workflow(self):
        """Execute the complete complaint lifecycle."""

        # =========================================================
        # 1. USER SUBMITS COMPLAINT
        # =========================================================
        submit_response = self.client.post(
            "/api/complaints",
            headers={
                "Authorization": f"Bearer {self.student_tok}"
            },
            json={
                "title": "Air conditioning unit leaking water in Lab 3",
                "description": (
                    "The AC unit in Lab 3 is leaking water over "
                    "computer desks, creating an electrical hazard."
                ),
            },
        )

        self.assertEqual(submit_response.status_code, 201)

        complaint_id = (
            submit_response
            .get_json()["data"]["complaint"]["id"]
        )

        self.assertEqual(
            submit_response
            .get_json()["data"]["complaint"]["status"],
            ComplaintStatus.PENDING,
        )

        # =========================================================
        # 2. ADMIN MARKS COMPLAINT UNDER REVIEW
        # =========================================================
        review_response = self.client.put(
            f"/api/admin/complaints/{complaint_id}/review",
            headers={
                "Authorization": f"Bearer {self.admin_tok}"
            },
        )

        self.assertEqual(review_response.status_code, 200)

        self.assertEqual(
            review_response
            .get_json()["data"]["complaint"]["status"],
            ComplaintStatus.UNDER_REVIEW,
        )

        # =========================================================
        # 3. ADMIN OVERRIDES AI CLASSIFICATION
        # =========================================================
        classification_response = self.client.put(
            f"/api/admin/complaints/{complaint_id}/classification",
            headers={
                "Authorization": f"Bearer {self.admin_tok}"
            },
            json={
                "category": "Infrastructure",
                "priority": "CRITICAL",
                "department": "Maintenance",
            },
        )

        self.assertEqual(
            classification_response.status_code,
            200,
        )

        classification_data = (
            classification_response
            .get_json()["data"]["complaint"]
        )

        self.assertEqual(
            classification_data["category"],
            "Infrastructure",
        )

        self.assertEqual(
            classification_data["priority"],
            "CRITICAL",
        )

        self.assertEqual(
            classification_data["department"],
            "Maintenance",
        )

        # =========================================================
        # 4. ADMIN MOVES COMPLAINT TO IN_PROGRESS
        # =========================================================
        progress_response = self.client.put(
            f"/api/admin/complaints/{complaint_id}/status",
            headers={
                "Authorization": f"Bearer {self.admin_tok}"
            },
            json={
                "status": "IN_PROGRESS",
                "remark": (
                    "Administrator started working on the "
                    "air conditioning issue."
                ),
            },
        )

        self.assertEqual(progress_response.status_code, 200)

        self.assertEqual(
            progress_response
            .get_json()["data"]["complaint"]["status"],
            ComplaintStatus.IN_PROGRESS,
        )

        # =========================================================
        # 5. ADMIN RESOLVES COMPLAINT
        # =========================================================
        resolve_response = self.client.put(
            f"/api/admin/complaints/{complaint_id}/status",
            headers={
                "Authorization": f"Bearer {self.admin_tok}"
            },
            json={
                "status": "RESOLVED",
                "remark": (
                    "AC drainage pipe cleaned and leaking issue "
                    "has been fixed."
                ),
            },
        )

        self.assertEqual(resolve_response.status_code, 200)

        self.assertEqual(
            resolve_response
            .get_json()["data"]["complaint"]["status"],
            ComplaintStatus.RESOLVED,
        )

        # =========================================================
        # 6. USER REJECTS THE RESOLUTION
        # =========================================================
        reject_response = self.client.post(
            f"/api/complaints/{complaint_id}/reject",
            headers={
                "Authorization": f"Bearer {self.student_tok}"
            },
            json={
                "reason": (
                    "Water is still dripping slowly from "
                    "the left vent."
                ),
            },
        )

        self.assertEqual(reject_response.status_code, 200)

        self.assertEqual(
            reject_response
            .get_json()["data"]["complaint"]["status"],
            ComplaintStatus.REOPENED,
        )

        # =========================================================
        # 7. ADMIN RE-RESOLVES THE REOPENED COMPLAINT
        # =========================================================
        resolve_again_response = self.client.put(
            f"/api/admin/complaints/{complaint_id}/status",
            headers={
                "Authorization": f"Bearer {self.admin_tok}"
            },
            json={
                "status": "RESOLVED",
                "remark": (
                    "Secondary internal seal tightened. "
                    "No further water leakage observed."
                ),
            },
        )

        self.assertEqual(
            resolve_again_response.status_code,
            200,
        )

        self.assertEqual(
            resolve_again_response
            .get_json()["data"]["complaint"]["status"],
            ComplaintStatus.RESOLVED,
        )

        # =========================================================
        # 8. USER CONFIRMS RESOLUTION
        # =========================================================
        confirm_response = self.client.post(
            f"/api/complaints/{complaint_id}/confirm",
            headers={
                "Authorization": f"Bearer {self.student_tok}"
            },
        )

        self.assertEqual(confirm_response.status_code, 200)

        self.assertEqual(
            confirm_response
            .get_json()["data"]["complaint"]["status"],
            ComplaintStatus.CONFIRMED,
        )

        # =========================================================
        # 9. USER SUBMITS FEEDBACK
        # =========================================================
        feedback_response = self.client.post(
            f"/api/complaints/{complaint_id}/feedback",
            headers={
                "Authorization": f"Bearer {self.student_tok}"
            },
            json={
                "rating": 5,
                "comment": (
                    "Excellent follow-up and prompt fix!"
                ),
            },
        )

        self.assertEqual(
            feedback_response.status_code,
            201,
        )

        feedback_data = (
            feedback_response
            .get_json()["data"]["feedback"]
        )

        self.assertEqual(
            feedback_data["rating"],
            5,
        )

        # =========================================================
        # 10. DUPLICATE FEEDBACK MUST BE REJECTED
        # =========================================================
        duplicate_feedback_response = self.client.post(
            f"/api/complaints/{complaint_id}/feedback",
            headers={
                "Authorization": f"Bearer {self.student_tok}"
            },
            json={
                "rating": 4,
                "comment": "Trying to submit feedback again.",
            },
        )

        self.assertEqual(
            duplicate_feedback_response.status_code,
            409,
        )

        # =========================================================
        # 11. VERIFY FINAL COMPLAINT DETAILS + AUDIT HISTORY
        # =========================================================
        details_response = self.client.get(
            f"/api/complaints/{complaint_id}",
            headers={
                "Authorization": f"Bearer {self.student_tok}"
            },
        )

        self.assertEqual(
            details_response.status_code,
            200,
        )

        complaint_data = (
            details_response
            .get_json()["data"]["complaint"]
        )

        self.assertEqual(
            complaint_data["status"],
            ComplaintStatus.CONFIRMED,
        )

        # Timeline should contain at least:
        # PENDING
        # UNDER_REVIEW
        # IN_PROGRESS
        # RESOLVED
        # REOPENED
        # RESOLVED
        # CONFIRMED
        self.assertGreaterEqual(
            len(complaint_data["updates"]),
            7,
        )


if __name__ == "__main__":
    unittest.main()

