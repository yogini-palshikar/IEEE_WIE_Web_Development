from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..database import get_db
from ..schemas import DispatchCreate

router = APIRouter(prefix="/dispatches", tags=["Dispatches"])


@router.get("/")
def get_dispatches(db: Session = Depends(get_db)):
    result = db.execute(
        text("""
            SELECT
                id,
                incident_id,
                crew_id,
                dispatched_at,
                status,
                eta
            FROM dispatches
            ORDER BY dispatched_at DESC
        """)
    )

    dispatches = []

    for row in result:
        dispatches.append(dict(row._mapping))

    return dispatches


@router.get("/{dispatch_id:int}")
def get_dispatch(
    dispatch_id: int,
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("""
            SELECT
                id,
                incident_id,
                crew_id,
                dispatched_at,
                status,
                eta
            FROM dispatches
            WHERE id = :dispatch_id
        """),
        {"dispatch_id": dispatch_id}
    )

    row = result.fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Dispatch not found"
        )

    return dict(row._mapping)
@router.post("/")
def create_dispatch(
    dispatch: DispatchCreate,
    db: Session = Depends(get_db)
):
    # Check that the incident exists
    incident_check = db.execute(
        text("""
            SELECT id
            FROM incidents
            WHERE id = :incident_id
        """),
        {"incident_id": dispatch.incident_id}
    ).fetchone()

    if incident_check is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    # Check that the crew exists and is available
    crew_check = db.execute(
        text("""
            SELECT id, available
            FROM crews
            WHERE id = :crew_id
        """),
        {"crew_id": dispatch.crew_id}
    ).fetchone()

    if crew_check is None:
        raise HTTPException(
            status_code=404,
            detail="Crew not found"
        )

    if not crew_check.available:
        raise HTTPException(
            status_code=400,
            detail="Crew is not available"
        )

    # Create the dispatch
    result = db.execute(
        text("""
            INSERT INTO dispatches (
                incident_id,
                crew_id,
                dispatched_at,
                status,
                eta
            )
            VALUES (
                :incident_id,
                :crew_id,
                CURRENT_TIMESTAMP,
                'dispatched',
                :eta
            )
            RETURNING id
        """),
        {
            "incident_id": dispatch.incident_id,
            "crew_id": dispatch.crew_id,
            "eta": dispatch.eta
        }
    )

    dispatch_id = result.scalar()

    # Mark the crew as unavailable
    db.execute(
        text("""
            UPDATE crews
            SET
                available = FALSE,
                status = 'assigned'
            WHERE id = :crew_id
        """),
        {"crew_id": dispatch.crew_id}
    )

    db.commit()

    return {
        "message": "Crew dispatched successfully",
        "dispatch_id": dispatch_id,
        "incident_id": dispatch.incident_id,
        "crew_id": dispatch.crew_id,
        "eta": dispatch.eta
    }