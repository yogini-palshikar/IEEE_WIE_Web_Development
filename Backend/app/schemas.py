from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class ReportCreate(BaseModel):
    description: str
    latitude: float
    longitude: float


class ReportResponse(BaseModel):
    id: int
    timestamp: Optional[datetime] = None
    description: Optional[str] = None
    classification: Optional[str] = None
    leak_probability: Optional[float] = None
    incident_id: Optional[int] = None
    status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
class ReportStatusUpdate(BaseModel):
    status: str
class ReportIncidentUpdate(BaseModel):
    incident_id: int
class IncidentCreate(BaseModel):
    latitude: float
    longitude: float


class IncidentUpdate(BaseModel):
    radius: Optional[float] = None
    leak_probability: Optional[float] = None
    classification: Optional[str] = None
    severity: Optional[int] = None
    priority: Optional[int] = None
    status: Optional[str] = None
    recommended_action: Optional[str] = None
class CrewStatusUpdate(BaseModel):
    status: str
    available: Optional[bool] = None
class CrewCreate(BaseModel):
    name: str
    capability: str
    latitude: float
    longitude: float
    available: Optional[bool] = True
    status: Optional[str] = "available"
class DispatchCreate(BaseModel):
    incident_id: int
    crew_id: int
    eta: Optional[int] = None