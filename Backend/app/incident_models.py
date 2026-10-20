from sqlalchemy import Column, Integer, Text, Float, DateTime
from geoalchemy2 import Geometry
from .database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(Geometry(geometry_type="POINT", srid=4326))
    radius = Column(Float)
    report_count = Column(Integer)
    first_report = Column(DateTime)
    last_report = Column(DateTime)
    leak_probability = Column(Float)
    classification = Column(Text)
    severity = Column(Integer)
    priority = Column(Integer)
    status = Column(Text)
    recommended_action = Column(Text)
    created_at = Column(DateTime)