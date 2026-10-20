from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..database import get_db
from ..schemas import CrewStatusUpdate, CrewCreate

router = APIRouter(prefix="/crews", tags=["Crews"])

DEFAULT_CREWS = [
    {
        "name": "Rapid Response Alpha",
        "capability": "Pipe Burst Repair & Heavy Excavation",
        "latitude": 12.9730,
        "longitude": 79.1600,
        "available": True,
        "status": "available",
    },
    {
        "name": "Drainage Taskforce Bravo",
        "capability": "Sewer & Storm Drain Clearing",
        "latitude": 12.9540,
        "longitude": 79.1680,
        "available": True,
        "status": "available",
    },
    {
        "name": "Water Main Unit Charlie",
        "capability": "Valve Isolation & High-Pressure Leaks",
        "latitude": 12.9680,
        "longitude": 79.1550,
        "available": True,
        "status": "available",
    },
    {
        "name": "Emergency Patrol Delta",
        "capability": "Acoustic Survey & Flood Pumping",
        "latitude": 12.9750,
        "longitude": 79.1650,
        "available": True,
        "status": "available",
    },
]


@router.get("/")
def get_crews(db: Session = Depends(get_db)):
    result = db.execute(
        text("""
            SELECT
                id,
                name,
                capability,
                available,
                status,
                ST_Y(location::geometry) AS latitude,
                ST_X(location::geometry) AS longitude
            FROM crews
            ORDER BY id
        """)
    )

    crews = [dict(row._mapping) for row in result]
    return crews


@router.post("/seed")
def seed_default_crews(db: Session = Depends(get_db)):
    for crew in DEFAULT_CREWS:
        db.execute(
            text("""
                INSERT INTO crews (name, capability, location, available, status)
                VALUES (:name, :capability, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), :available, :status)
            """),
            crew
        )
    db.commit()
    return {"message": f"{len(DEFAULT_CREWS)} default crews seeded successfully"}


@router.post("/")
def create_crew(crew: CrewCreate, db: Session = Depends(get_db)):
    result = db.execute(
        text("""
            INSERT INTO crews (name, capability, location, available, status)
            VALUES (:name, :capability, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), :available, :status)
            RETURNING id
        """),
        {
            "name": crew.name,
            "capability": crew.capability,
            "latitude": crew.latitude,
            "longitude": crew.longitude,
            "available": crew.available,
            "status": crew.status,
        }
    )
    new_id = result.scalar()
    db.commit()
    return {"message": "Crew registered successfully", "crew_id": new_id}



@router.get("/{crew_id:int}")
def get_crew(
    crew_id: int,
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("""
            SELECT
                id,
                name,
                capability,
                available,
                status,
                ST_Y(location::geometry) AS latitude,
                ST_X(location::geometry) AS longitude
            FROM crews
            WHERE id = :crew_id
        """),
        {"crew_id": crew_id}
    )

    row = result.fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Crew not found"
        )

    return dict(row._mapping)
@router.patch("/{crew_id:int}/status")
def update_crew_status(
    crew_id: int,
    status_update: CrewStatusUpdate,
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("""
            UPDATE crews
            SET
                status = :status,
                available = COALESCE(:available, available)
            WHERE id = :crew_id
            RETURNING id, status, available
        """),
        {
            "crew_id": crew_id,
            "status": status_update.status,
            "available": status_update.available
        }
    )

    row = result.fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Crew not found"
        )

    db.commit()

    return {
        "message": "Crew status updated successfully",
        "crew_id": row.id,
        "status": row.status,
        "available": row.available
    }