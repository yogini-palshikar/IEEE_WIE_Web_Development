from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_db
from ..schemas import ReportCreate, ReportStatusUpdate, ReportIncidentUpdate
from ..storage import STORAGE_BUCKET, get_supabase
import json
import os
import subprocess
import uuid
from pathlib import Path
from typing import List

AI_MODULE_DIR = Path(
    os.getenv("AI_MODULE_DIR", "../ai")
).resolve()

AI_PYTHON = os.getenv("AI_PYTHON_PATH", "python")

TEXT_CLASSIFIER = AI_MODULE_DIR / "classify_text_report.py"

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/")
def get_reports(db: Session = Depends(get_db)):
    result = db.execute(
        text("""
            SELECT
                id,
                description,
                classification,
                leak_probability,
                incident_id,
                status,
                created_at
            FROM reports
            ORDER BY created_at DESC
        """)
    )

    reports = []

    for row in result:
        reports.append(dict(row._mapping))

    return reports



@router.post("/")
def create_report(
    report: ReportCreate,
    db: Session = Depends(get_db)
):
    # Attempt AI classification with a 6-second timeout. If unavailable or slow,
    # gracefully fall back to heuristic categorization so user submission never fails.
    classification = "normal"
    leak_probability = 0.50

    if TEXT_CLASSIFIER.exists():
        try:
            result = subprocess.run(
                [
                    AI_PYTHON,
                    str(TEXT_CLASSIFIER),
                    report.description
                ],
                capture_output=True,
                text=True,
                timeout=6,
                check=False
            )
            if result.returncode == 0 and result.stdout.strip():
                ai_result = json.loads(result.stdout)
                classification = ai_result.get("classification", "normal")
                leak_probability = float(ai_result.get("leak_probability", 0.50))
            else:
                raise ValueError(result.stderr or "Non-zero exit code")
        except Exception as exc:
            # Fallback based on report text and problem type tags
            desc_lower = report.description.lower()
            if any(k in desc_lower for k in ["pipe burst", "burst", "ruptur", "gush", "fountain"]):
                classification = "pipe_burst"
                leak_probability = 0.95
            elif any(k in desc_lower for k in ["sewer", "sewage", "manhole", "overflow", "drain"]):
                classification = "drain_sewer_overflow"
                leak_probability = 0.80
            elif any(k in desc_lower for k in ["water leakage", "leak", "bubbl", "trickl"]):
                classification = "water_main_leak"
                leak_probability = 0.85
            elif any(k in desc_lower for k in ["waterlog", "flood", "submerg", "standing water"]):
                classification = "waterlogging"
                leak_probability = 0.60
            elif any(k in desc_lower for k in ["rain", "puddle", "wet road", "slick"]):
                classification = "wet_road_rain"
                leak_probability = 0.30
            else:
                classification = "normal"
                leak_probability = 0.10

    try:
        result = db.execute(
            text("""
                INSERT INTO reports (
                    timestamp,
                    location,
                    description,
                    classification,
                    leak_probability,
                    status,
                    created_at
                )
                VALUES (
                    CURRENT_TIMESTAMP,
                    ST_SetSRID(
                        ST_MakePoint(:longitude, :latitude),
                        4326
                    ),
                    :description,
                    :classification,
                    :leak_probability,
                    'new',
                    CURRENT_TIMESTAMP
                )
                RETURNING id
            """),
            {
                "latitude": report.latitude,
                "longitude": report.longitude,
                "description": report.description,
                "classification": classification,
                "leak_probability": leak_probability
            }
        )

        new_id = result.scalar_one()
        db.commit()

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create report: {exc}",
        )

    return {
        "message": "Report created and classified successfully",
        "report_id": new_id,
        "classification": classification,
        "leak_probability": leak_probability
    }

@router.get("/nearby")
def get_nearby_reports(
    latitude: float,
    longitude: float,
    radius: float = 100,
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("""
            SELECT
                id,
                description,
                classification,
                leak_probability,
                incident_id,
                status,
                created_at,
                ST_Distance(
                    location::geography,
                    ST_SetSRID(
                        ST_MakePoint(:longitude, :latitude),
                        4326
                    )::geography
                ) AS distance_meters
            FROM reports
            WHERE ST_DWithin(
                location::geography,
                ST_SetSRID(
                    ST_MakePoint(:longitude, :latitude),
                    4326
                )::geography,
                :radius
            )
            ORDER BY distance_meters
        """),
        {
            "latitude": latitude,
            "longitude": longitude,
            "radius": radius
        }
    )

    reports = []

    for row in result:
        reports.append(dict(row._mapping))

    return reports
@router.get("/{report_id:int}")
def get_report(
    report_id: int,
    db: Session = Depends(get_db)
):
    result = db.execute(
        
        text("""
            SELECT
                id,
                description,
                classification,
                leak_probability,
                incident_id,
                status,
                created_at,
                ST_Y(location::geometry) AS latitude,
                ST_X(location::geometry) AS longitude
            FROM reports
            WHERE id = :report_id
        """),

        {
            "report_id": report_id
        }
    )

    row = result.fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    return dict(row._mapping)
@router.patch("/{report_id:int}/status")
def update_report_status(
    report_id: int,
    status_update: ReportStatusUpdate,
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("""
            UPDATE reports
            SET status = :status
            WHERE id = :report_id
            RETURNING id, status
        """),
        {
            "report_id": report_id,
            "status": status_update.status
        }
    )

    row = result.fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    db.commit()

    return {
        "message": "Report status updated successfully",
        "report_id": row.id,
        "status": row.status
    }
@router.patch("/{report_id:int}/incident")
def assign_report_to_incident(
    report_id: int,
    incident_update: ReportIncidentUpdate,
    db: Session = Depends(get_db)
):
    # First check that the report exists
    report_check = db.execute(
        text("""
            SELECT id
            FROM reports
            WHERE id = :report_id
        """),
        {"report_id": report_id}
    ).fetchone()

    if report_check is None:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    # Check that the incident exists
    incident_check = db.execute(
        text("""
            SELECT id
            FROM incidents
            WHERE id = :incident_id
        """),
        {"incident_id": incident_update.incident_id}
    ).fetchone()

    if incident_check is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    # Connect the report to the incident
    result = db.execute(
        text("""
            UPDATE reports
            SET incident_id = :incident_id
            WHERE id = :report_id
            RETURNING id, incident_id
        """),
        {
            "report_id": report_id,
            "incident_id": incident_update.incident_id
        }
    )

    row = result.fetchone()

    db.commit()

    return {
        "message": "Report assigned to incident successfully",
        "report_id": row.id,
        "incident_id": row.incident_id
    }

@router.get("/{report_id:int}/rematch")
def rematch_report(
    report_id: int,
    db: Session = Depends(get_db)
):
    return match_report_to_incident(report_id, db)


@router.post("/{report_id:int}/match-incident")
def match_report_to_incident(
    report_id: int,
    db: Session = Depends(get_db)
):
    try:
        # 1. Load the report and its AI classification.
        report = db.execute(
            text("""
                SELECT
                    id,
                    timestamp,
                    classification,
                    leak_probability
                FROM reports
                WHERE id = :report_id
            """),
            {"report_id": report_id}
        ).fetchone()

        if report is None:
            raise HTTPException(
                status_code=404,
                detail="Report not found"
            )

        classification = report.classification or "normal"
        leak_probability = float(
            report.leak_probability
            if report.leak_probability is not None
            else 0.0
        )
        leak_probability = max(0.0, min(1.0, leak_probability))

        # 2. Calculate severity using the existing project formula.
        severity_weights = {
            "pipe_burst": 0.95,
            "water_main_leak": 0.85,
            "drain_sewer_overflow": 0.80,
            "waterlogging": 0.60,
            "wet_road_rain": 0.30,
            "normal": 0.10,
        }

        base_weight = severity_weights.get(classification, 0.5)

        # Provisional: leak_probability stands in for classifier confidence.
        severity = min(
            100,
            int((base_weight * 0.7 + leak_probability * 0.3) * 100)
        )

        # 3. Choose a recommended action for the predicted category.
        recommended_actions = {
            "pipe_burst": (
                "Urgently inspect the suspected pipe burst and "
                "assess whether the water supply needs isolation."
            ),
            "water_main_leak": (
                "Dispatch a crew to inspect and locate the suspected "
                "water main leak."
            ),
            "drain_sewer_overflow": (
                "Inspect the affected drain or sewer and assess "
                "public-health and access risks."
            ),
            "waterlogging": (
                "Inspect the flooded area and assess drainage and "
                "road-access risks."
            ),
            "wet_road_rain": (
                "Review the report and monitor for worsening water "
                "accumulation."
            ),
            "normal": (
                "Review the report; verify whether a water-related "
                "incident is present."
            ),
        }

        recommended_action = recommended_actions.get(
            classification,
            "Manually review the report and verify the incident."
        )

        # 4. Find the nearest incident within 100 metres.
        incident = db.execute(
            text("""
                SELECT
                    i.id,
                    i.report_count,
                    i.severity,
                    ST_Distance(
                        i.location::geography,
                        r.location::geography
                    ) AS distance_meters
                FROM incidents AS i
                CROSS JOIN reports AS r
                WHERE r.id = :report_id
                  AND i.status NOT IN ('resolved', 'closed')
                  AND ST_DWithin(
                      i.location::geography,
                      r.location::geography,
                      100
                  )
                ORDER BY distance_meters
                LIMIT 1
            """),
            {"report_id": report_id}
        ).fetchone()

        # 5. Update an existing incident if a nearby one is found.
        if incident is not None:
            report_count = (incident.report_count or 0) + 1

            # Keep the highest severity observed so far.
            incident_severity = max(
                severity,
                incident.severity or 0
            )

            priority = min(
                100,
                int(
                    incident_severity * 0.6
                    + min(report_count, 50) * 0.8
                )
            )

            db.execute(
                text("""
                    UPDATE reports
                    SET incident_id = :incident_id
                    WHERE id = :report_id
                """),
                {
                    "incident_id": incident.id,
                    "report_id": report_id
                }
            )

            db.execute(
                text("""
                    UPDATE incidents
                    SET
                        report_count = :report_count,
                        last_report = CURRENT_TIMESTAMP,
                        classification = :classification,
                        leak_probability = GREATEST(
                            COALESCE(leak_probability, 0),
                            :leak_probability
                        ),
                        severity = :severity,
                        priority = :priority,
                        recommended_action = :recommended_action
                    WHERE id = :incident_id
                """),
                {
                    "incident_id": incident.id,
                    "report_count": report_count,
                    "classification": classification,
                    "leak_probability": leak_probability,
                    "severity": incident_severity,
                    "priority": priority,
                    "recommended_action": recommended_action
                }
            )

            db.commit()

            return {
                "matched": True,
                "created": False,
                "report_id": report_id,
                "incident_id": incident.id,
                "distance_meters": round(
                    float(incident.distance_meters), 2
                ),
                "classification": classification,
                "leak_probability": leak_probability,
                "severity": incident_severity,
                "priority": priority,
                "recommended_action": recommended_action,
                "message": "Report matched and incident updated"
            }

        # 6. No nearby incident: create a new one.
        report_timestamp = report.timestamp

        new_incident = db.execute(
            text("""
                INSERT INTO incidents (
                    location,
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
                    created_at
                )
                VALUES (
                    (
                        SELECT location
                        FROM reports
                        WHERE id = :report_id
                    ),
                    100,
                    1,
                    COALESCE(:report_timestamp, CURRENT_TIMESTAMP),
                    COALESCE(:report_timestamp, CURRENT_TIMESTAMP),
                    :leak_probability,
                    :classification,
                    :severity,
                    :priority,
                    'new',
                    :recommended_action,
                    CURRENT_TIMESTAMP
                )
                RETURNING id
            """),
            {
                "report_id": report_id,
                "report_timestamp": report_timestamp,
                "leak_probability": leak_probability,
                "classification": classification,
                "severity": severity,
                "priority": min(
                    100,
                    int(severity * 0.6 + 1 * 0.8)
                ),
                "recommended_action": recommended_action
            }
        )

        new_incident_id = new_incident.scalar_one()

        # Compute once so the INSERT value and the return value are identical (BUG-04)
        new_priority = min(100, int(severity * 0.6 + 1 * 0.8))

        db.execute(
            text("""
                UPDATE reports
                SET incident_id = :incident_id
                WHERE id = :report_id
            """),
            {
                "incident_id": new_incident_id,
                "report_id": report_id
            }
        )

        db.commit()

        return {
            "matched": False,
            "created": True,
            "report_id": report_id,
            "incident_id": new_incident_id,
            "classification": classification,
            "leak_probability": leak_probability,
            "severity": severity,
            "priority": new_priority,
            "recommended_action": recommended_action,
            "message": "New incident created and prioritized"
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


# ---------------------------------------------------------------------------
# Image upload and retrieval
# ---------------------------------------------------------------------------

_ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024   # 5 MB per image
_MAX_FILES = 5


@router.post("/{report_id:int}/images")
async def upload_report_images(
    report_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload up to 5 images for an existing report.

    Images are stored in the private `incident-images` Supabase Storage
    bucket under `reports/{report_id}/{uuid}.{ext}`.  Storage paths are
    saved as a JSON array in `reports.image_path`.

    If the database update fails after a successful upload, the function
    attempts to remove the already-uploaded files to avoid orphaned objects.
    """
    # 1. Verify the report exists.
    report_check = db.execute(
        text("SELECT id FROM reports WHERE id = :id"),
        {"id": report_id},
    ).fetchone()
    if report_check is None:
        raise HTTPException(status_code=404, detail="Report not found")

    # 2. Guard against too many files.
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    if len(files) > _MAX_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {_MAX_FILES} images allowed per request",
        )

    # 3. Read and validate every file before touching storage.
    validated: list[tuple[str, bytes, str]] = []   # (content_type, bytes, extension)
    for upload in files:
        content_type = upload.content_type or ""
        if content_type not in _ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=415,
                detail=(
                    f"Unsupported MIME type '{content_type}'. "
                    f"Allowed: {', '.join(sorted(_ALLOWED_MIME_TYPES))}"
                ),
            )
        data = await upload.read()
        if len(data) > _MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=(
                    f"File '{upload.filename}' is "
                    f"{len(data) // 1024} KB — exceeds the 5 MB limit"
                ),
            )
        filename = upload.filename or ""
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
        validated.append((content_type, data, ext))

    # 4. Upload validated files to Supabase Storage.
    supabase = get_supabase()
    uploaded_paths: list[str] = []
    try:
        for content_type, data, ext in validated:
            storage_path = f"reports/{report_id}/{uuid.uuid4()}.{ext}"
            supabase.storage.from_(STORAGE_BUCKET).upload(
                path=storage_path,
                file=data,
                file_options={"content-type": content_type},
            )
            uploaded_paths.append(storage_path)
    except Exception as exc:
        # Best-effort cleanup of any already-uploaded objects.
        if uploaded_paths:
            try:
                supabase.storage.from_(STORAGE_BUCKET).remove(uploaded_paths)
            except Exception:
                pass
        raise HTTPException(
            status_code=502,
            detail=f"Supabase Storage upload failed: {exc}",
        )

    # 5. Persist the storage paths in reports.image_path.
    try:
        db.execute(
            text("""
                UPDATE reports
                SET image_path = :image_path
                WHERE id = :report_id
            """),
            {
                "report_id": report_id,
                "image_path": json.dumps(uploaded_paths),
            },
        )
        db.commit()
    except Exception as exc:
        db.rollback()
        # Attempt to remove the orphaned storage objects.
        try:
            supabase.storage.from_(STORAGE_BUCKET).remove(uploaded_paths)
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail=f"Database update failed after upload: {exc}",
        )

    return {
        "message": f"{len(uploaded_paths)} image(s) uploaded successfully",
        "report_id": report_id,
        "count": len(uploaded_paths),
        "paths": uploaded_paths,
    }


@router.get("/{report_id:int}/images")
def get_report_images(
    report_id: int,
    db: Session = Depends(get_db),
    expires_in: int = 3600,
):
    """
    Return signed URLs for all images attached to a report.

    `expires_in` controls URL lifetime in seconds (default 1 hour).
    Each URL is valid only for that duration and is generated on demand
    using the service-role key — the key never reaches the frontend.
    """
    row = db.execute(
        text("SELECT image_path FROM reports WHERE id = :id"),
        {"id": report_id},
    ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Report not found")

    if not row.image_path:
        return {"report_id": report_id, "images": []}

    # Support both the new JSON-array format and any legacy single-path string.
    try:
        paths: list[str] = json.loads(row.image_path)
        if isinstance(paths, str):
            paths = [paths]
    except (json.JSONDecodeError, TypeError):
        paths = [row.image_path]

    if not paths:
        return {"report_id": report_id, "images": []}

    supabase = get_supabase()
    images = []
    for path in paths:
        try:
            result = supabase.storage.from_(STORAGE_BUCKET).create_signed_url(
                path=path,
                expires_in=expires_in,
            )
            # supabase-py v2 returns a dict with key "signedURL"
            signed_url = result.get("signedURL") or result.get("signed_url")
            images.append(
                {"path": path, "url": signed_url, "expires_in": expires_in}
            )
        except Exception as exc:
            # Surface per-file errors without aborting the whole response.
            images.append({"path": path, "url": None, "error": str(exc)})

    return {"report_id": report_id, "images": images}
