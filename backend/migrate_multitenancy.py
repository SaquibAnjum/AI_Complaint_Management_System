"""Safe, non-destructive migration script for Multi-Organization architecture.

Preserves all existing data while upgrading schema to support multi-tenancy.
"""

import os
import sqlite3
from datetime import datetime, timezone

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATHS = [
    os.path.join(BASE_DIR, "instance", "complaints.db"),
    os.path.join(BASE_DIR, "complaints.db"),
]


def table_exists(cur, table_name):
    cur.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
    return cur.fetchone() is not None


def get_column_names(cur, table_name):
    cur.execute(f"PRAGMA table_info({table_name})")
    return [col[1] for col in cur.fetchall()]


def migrate_database(db_path):
    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}, skipping.")
        return

    print(f"Migrating database: {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    try:
        # 1. Create organizations table if absent
        if not table_exists(cur, "organizations"):
            print("Creating 'organizations' table...")
            cur.execute("""
                CREATE TABLE organizations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(150) NOT NULL,
                    slug VARCHAR(100) NOT NULL UNIQUE,
                    email VARCHAR(120),
                    phone VARCHAR(30),
                    address TEXT,
                    organization_type VARCHAR(50) NOT NULL DEFAULT 'Other',
                    is_active BOOLEAN NOT NULL DEFAULT 1,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL
                );
            """)
            cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_organizations_slug ON organizations (slug);")

        # 2. Ensure default organization exists
        cur.execute("SELECT id FROM organizations WHERE slug = 'apex-university'")
        row = cur.fetchone()
        now_str = datetime.now(timezone.utc).isoformat()
        if not row:
            print("Inserting default organization 'Apex Global University'...")
            cur.execute("""
                INSERT INTO organizations (name, slug, email, phone, organization_type, is_active, created_at, updated_at)
                VALUES ('Apex Global University', 'apex-university', 'admin@apex.edu', '+1 555-0199', 'University', 1, ?, ?)
            """, (now_str, now_str))
            default_org_id = cur.lastrowid
        else:
            default_org_id = row[0]

        print(f"Default organization ID is: {default_org_id}")

        # 3. Migrate 'users' table
        if table_exists(cur, "users"):
            cols = get_column_names(cur, "users")
            if "organization_id" not in cols:
                print("Adding 'organization_id' to users table...")
                cur.execute(f"ALTER TABLE users ADD COLUMN organization_id INTEGER REFERENCES organizations(id) DEFAULT {default_org_id}")
                cur.execute("CREATE INDEX IF NOT EXISTS ix_users_organization_id ON users (organization_id);")
            if "phone" not in cols:
                cur.execute("ALTER TABLE users ADD COLUMN phone VARCHAR(30)")
            if "department" not in cols:
                cur.execute("ALTER TABLE users ADD COLUMN department VARCHAR(100)")
            if "designation" not in cols:
                cur.execute("ALTER TABLE users ADD COLUMN designation VARCHAR(100)")

            # Backfill any null organization_id
            cur.execute(f"UPDATE users SET organization_id = {default_org_id} WHERE organization_id IS NULL")

        # 4. Migrate 'complaints' table
        if table_exists(cur, "complaints"):
            cols = get_column_names(cur, "complaints")
            if "organization_id" not in cols:
                print("Adding 'organization_id' to complaints table...")
                cur.execute(f"ALTER TABLE complaints ADD COLUMN organization_id INTEGER REFERENCES organizations(id) DEFAULT {default_org_id}")
                cur.execute("CREATE INDEX IF NOT EXISTS ix_complaints_organization_id ON complaints (organization_id);")
            if "assigned_staff_id" not in cols:
                print("Adding 'assigned_staff_id' to complaints table...")
                cur.execute("ALTER TABLE complaints ADD COLUMN assigned_staff_id INTEGER REFERENCES users(id)")
                cur.execute("CREATE INDEX IF NOT EXISTS ix_complaints_assigned_staff_id ON complaints (assigned_staff_id);")

            # Backfill organization_id
            cur.execute(f"UPDATE complaints SET organization_id = {default_org_id} WHERE organization_id IS NULL")

            # Populate assigned_staff_id from active assignments if empty
            if table_exists(cur, "assignments"):
                cur.execute("""
                    UPDATE complaints
                    SET assigned_staff_id = (
                        SELECT staff_id FROM assignments
                        WHERE assignments.complaint_id = complaints.id AND assignments.status = 'ACTIVE'
                        ORDER BY id DESC LIMIT 1
                    )
                    WHERE assigned_staff_id IS NULL
                """)

        # 5. Migrate 'assignments' table
        if table_exists(cur, "assignments"):
            cols = get_column_names(cur, "assignments")
            if "organization_id" not in cols:
                print("Adding 'organization_id' to assignments table...")
                cur.execute(f"ALTER TABLE assignments ADD COLUMN organization_id INTEGER REFERENCES organizations(id) DEFAULT {default_org_id}")
                cur.execute("CREATE INDEX IF NOT EXISTS ix_assignments_organization_id ON assignments (organization_id);")
            cur.execute(f"UPDATE assignments SET organization_id = {default_org_id} WHERE organization_id IS NULL")

        # 6. Migrate 'complaint_updates' table
        if table_exists(cur, "complaint_updates"):
            cols = get_column_names(cur, "complaint_updates")
            if "organization_id" not in cols:
                print("Adding 'organization_id' to complaint_updates table...")
                cur.execute(f"ALTER TABLE complaint_updates ADD COLUMN organization_id INTEGER REFERENCES organizations(id) DEFAULT {default_org_id}")
                cur.execute("CREATE INDEX IF NOT EXISTS ix_complaint_updates_organization_id ON complaint_updates (organization_id);")
            cur.execute(f"UPDATE complaint_updates SET organization_id = {default_org_id} WHERE organization_id IS NULL")

        # 7. Migrate 'notifications' table
        if table_exists(cur, "notifications"):
            cols = get_column_names(cur, "notifications")
            if "organization_id" not in cols:
                print("Adding 'organization_id' to notifications table...")
                cur.execute(f"ALTER TABLE notifications ADD COLUMN organization_id INTEGER REFERENCES organizations(id) DEFAULT {default_org_id}")
                cur.execute("CREATE INDEX IF NOT EXISTS ix_notifications_organization_id ON notifications (organization_id);")
            cur.execute(f"UPDATE notifications SET organization_id = {default_org_id} WHERE organization_id IS NULL")

        # 8. Migrate 'feedback' table
        if table_exists(cur, "feedback"):
            cols = get_column_names(cur, "feedback")
            if "organization_id" not in cols:
                print("Adding 'organization_id' to feedback table...")
                cur.execute(f"ALTER TABLE feedback ADD COLUMN organization_id INTEGER REFERENCES organizations(id) DEFAULT {default_org_id}")
                cur.execute("CREATE INDEX IF NOT EXISTS ix_feedback_organization_id ON feedback (organization_id);")
            cur.execute(f"UPDATE feedback SET organization_id = {default_org_id} WHERE organization_id IS NULL")

        # 9. Create 'staff_invitations' table if absent
        if not table_exists(cur, "staff_invitations"):
            print("Creating 'staff_invitations' table...")
            cur.execute("""
                CREATE TABLE staff_invitations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    organization_id INTEGER NOT NULL REFERENCES organizations(id),
                    token_hash VARCHAR(64) NOT NULL UNIQUE,
                    expires_at DATETIME NOT NULL,
                    is_used BOOLEAN NOT NULL DEFAULT 0,
                    used_at DATETIME,
                    created_at DATETIME NOT NULL
                );
            """)
            cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_staff_invitations_token_hash ON staff_invitations (token_hash);")
            cur.execute("CREATE INDEX IF NOT EXISTS ix_staff_invitations_user_id ON staff_invitations (user_id);")
            cur.execute("CREATE INDEX IF NOT EXISTS ix_staff_invitations_organization_id ON staff_invitations (organization_id);")

        conn.commit()
        print(f"Migration completed successfully for {db_path}!")

    except Exception as e:
        conn.rollback()
        print(f"Error migrating {db_path}: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    for p in DB_PATHS:
        migrate_database(p)
