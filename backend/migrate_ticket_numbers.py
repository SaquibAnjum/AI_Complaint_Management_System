
"""Safely add organization-specific complaint ticket numbers."""

from sqlalchemy import inspect, text

from run import app
from app.extensions import db


with app.app_context():
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()

    if "complaints" not in tables:
        raise RuntimeError(
            "Complaints table not found. Check the configured database."
        )

    columns = {
        column["name"]
        for column in inspector.get_columns("complaints")
    }

    # Add the new column only if it does not already exist.
    with db.engine.begin() as connection:
        if "ticket_number" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE complaints "
                    "ADD COLUMN ticket_number INTEGER"
                )
            )
            print("Added ticket_number column.")

        # Read complaints in stable order.
        rows = connection.execute(
            text(
                """
                SELECT id, organization_id, ticket_number
                FROM complaints
                ORDER BY organization_id, id
                """
            )
        ).mappings().all()

        # Preserve existing ticket numbers, if any.
        last_number = {}

        for row in rows:
            organization_id = row["organization_id"]
            number = row["ticket_number"]

            if number is not None:
                last_number[organization_id] = max(
                    last_number.get(organization_id, 0),
                    number,
                )

        # Assign a separate sequence to each organization.
        updated_count = 0

        for row in rows:
            if row["ticket_number"] is not None:
                continue

            organization_id = row["organization_id"]
            next_number = last_number.get(organization_id, 0) + 1
            last_number[organization_id] = next_number

            connection.execute(
                text(
                    """
                    UPDATE complaints
                    SET ticket_number = :ticket_number
                    WHERE id = :complaint_id
                    """
                ),
                {
                    "ticket_number": next_number,
                    "complaint_id": row["id"],
                },
            )
            updated_count += 1

        # Prevent duplicate ticket numbers within an organization.
        connection.execute(
            text(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS
                uq_complaints_org_ticket_number
                ON complaints (organization_id, ticket_number)
                """
            )
        )

    print(
        f"Migration successful. Assigned numbers to "
        f"{updated_count} complaint(s)."
    )
