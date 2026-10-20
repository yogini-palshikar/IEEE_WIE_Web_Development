from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from .database import Base


class Dispatch(Base):
    __tablename__ = "dispatches"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    crew_id = Column(Integer, ForeignKey("crews.id"), nullable=False)
    dispatched_at = Column(DateTime)
    status = Column(Text)
    eta = Column(Integer)