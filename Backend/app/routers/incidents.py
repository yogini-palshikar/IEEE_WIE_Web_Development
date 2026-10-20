from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..database import get_db
from ..schemas import IncidentUpdate, IncidentCreate

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.get("/")
def get_incidents(db: Session = Depends(get_db)):
    result = db.execute(
        text("""
            SELECT
                id,
                radius,
                report_count,
                first_report,
                last_report,
                leak_probability,
                classification,
                severity,
                priority,
                status,
                recommended_action,
                created_at,
                ST_Y(location::geometry) AS latitude,
                ST_X(location::geometry) AS longitude
            FROM incidents
            ORDER BY created_at DESC
        """)
    )

    return [dict(row._mapping) for row in result]


@router.get("/{incident_id:int}")
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("""
            SELECT
                id,
                radius,
                report_count,
                first_report,
                last_report,
                leak_probability,
                classification,
                severity,
                priority,
                status,
                recommended_action,
                created_at,
                ST_Y(location::geometry) AS latitude,
                ST_X(location::geometry) AS longitude
            FROM incidents
            WHERE id = :incident_id
        """),
        {"incident_id": incident_id}
    )

    row = result.fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    return dict(row._mapping)


@router.post("/")
def create_incident(
    incident: IncidentCreate,
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("""
            INSERT INTO incidents (
                location,
                radius,
                report_count,
                status,
                created_at
            )
            VALUES (
                ST_SetSRID(
                    ST_MakePoint(:longitude, :latitude),
                    4326
                ),
                100,
                0,
                'new',
                CURRENT_TIMESTAMP
            )
            RETURNING id
        """),
        {
            "latitude": incident.latitude,
            "longitude": incident.longitude
        }
    )

    incident_id = result.scalar()

    db.commit()

    return {
        "message": "Incident created successfully",
        "incident_id": incident_id
    }
@router.patch("/{incident_id:int}")
def update_incident(
    incident_id: int,
    incident_update: IncidentUpdate,
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("""
            UPDATE incidents
            SET
                radius = COALESCE(:radius, radius),
                leak_probability = COALESCE(:leak_probability, leak_probability),
                classification = COALESCE(:classification, classification),
                severity = COALESCE(:severity, severity),
                priority = COALESCE(:priority, priority),
                status = COALESCE(:status, status),
                recommended_action = COALESCE(
                    :recommended_action,
                    recommended_action
                )
            WHERE id = :incident_id
            RETURNING id
        """),
        {
            "incident_id": incident_id,
            "radius": incident_update.radius,
            "leak_probability": incident_update.leak_probability,
            "classification": incident_update.classification,
            "severity": incident_update.severity,
            "priority": incident_update.priority,
            "status": incident_update.status,
            "recommended_action": incident_update.recommended_action
        }
    )

    row = result.fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    db.commit()

    return {
        "message": "Incident updated successfully",
        "incident_id": row.id
    }


@router.post("/{incident_id:int}/resolve")
def resolve_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    # 1. Update incident status to 'resolved'
    inc = db.execute(
        text("UPDATE incidents SET status = 'resolved' WHERE id = :id RETURNING id"),
        {"id": incident_id}
    ).fetchone()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    # 2. Update all associated reports to 'resolved'
    rep_res = db.execute(
        text("UPDATE reports SET status = 'resolved' WHERE incident_id = :id RETURNING id"),
        {"id": incident_id}
    ).fetchall()
    resolved_reports_count = len(rep_res)

    # 3. Find dispatched crews and set them back to available
    disp_rows = db.execute(
        text("SELECT crew_id FROM dispatches WHERE incident_id = :id"),
        {"id": incident_id}
    ).fetchall()

    for d in disp_rows:
        db.execute(
            text("UPDATE crews SET available = TRUE, status = 'available' WHERE id = :crew_id"),
            {"crew_id": d.crew_id}
        )

    # 4. Mark dispatches as completed
    db.execute(
        text("UPDATE dispatches SET status = 'completed' WHERE incident_id = :id"),
        {"id": incident_id}
    )

    db.commit()

    return {
        "message": f"Incident #{incident_id} successfully resolved and archived.",
        "incident_id": incident_id,
        "resolved_reports_count": resolved_reports_count,
        "crews_freed_count": len(disp_rows)
    }

