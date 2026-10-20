from sqlalchemy import Column, Integer, Text, Boolean
from geoalchemy2 import Geometry
from .database import Base


class Crew(Base):
    __tablename__ = "crews"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text)
    capability = Column(Text)
    location = Column(
        Geometry(
            geometry_type="POINT",
            srid=4326
        )
    )
    available = Column(Boolean)
    status = Column(Text)