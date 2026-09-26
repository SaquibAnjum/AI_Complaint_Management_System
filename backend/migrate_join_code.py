"""Migration script: add join_code column to organizations table."""
from app import create_app
from app.extensions import db
from app.models.organization import generate_join_code
from sqlalchemy import text

app = create_app()
with app.app_context():
    with db.engine.connect() as conn:
        # Step 1: Add column without UNIQUE (SQLite limitation)
        try:
            conn.execute(text('ALTER TABLE organizations ADD COLUMN join_code VARCHAR(16)'))
            conn.commit()
            print('Column join_code added.')
        except Exception as e:
            print(f'Column add skipped: {e}')

        # Step 2: Create unique index separately
        try:
            conn.execute(text('CREATE UNIQUE INDEX IF NOT EXISTS ix_organizations_join_code ON organizations(join_code)'))
            conn.commit()
            print('Unique index created.')
        except Exception as e:
            print(f'Index skipped: {e}')

    # Step 3: Backfill codes using raw SQL
    with db.engine.connect() as conn:
        rows = conn.execute(text('SELECT id, name FROM organizations WHERE join_code IS NULL')).fetchall()
        for row in rows:
            org_id, org_name = row[0], row[1]
            code = None
            for _ in range(30):
                candidate = generate_join_code()
                exists = conn.execute(text('SELECT 1 FROM organizations WHERE join_code = :c'), {'c': candidate}).fetchone()
                if not exists:
                    code = candidate
                    break
            if code:
                conn.execute(text('UPDATE organizations SET join_code = :code WHERE id = :id'), {'code': code, 'id': org_id})
                print(f'  Org "{org_name}" -> join_code={code}')
        conn.commit()

    # Step 4: Show all orgs
    with db.engine.connect() as conn:
        rows = conn.execute(text('SELECT id, name, slug, join_code FROM organizations')).fetchall()
        print('\nAll organizations:')
        for r in rows:
            print(f'  ID={r[0]} | {r[1]} | slug={r[2]} | join_code={r[3]}')

print('Done.')
