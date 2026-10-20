from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from geoalchemy2 import Geometry
from .database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime)
    location = Column(Geometry(geometry_type="POINT", srid=4326))
    description = Column(Text)
    image_path = Column(String)
    classification = Column(String)
    leak_probability = Column(Float)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    status = Column(String)
    created_at = Column(DateTime)