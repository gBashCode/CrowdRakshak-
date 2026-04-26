from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Temple(Base):
    __tablename__ = "temples"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    state = Column(String)
    imageLink = Column(String)
    zones_config = Column(JSON)
    exit_routes_config = Column(JSON)

    crowd_data = relationship("CrowdData", back_populates="temple")

class CrowdData(Base):
    __tablename__ = "crowd_data"

    id = Column(Integer, primary_key=True, index=True)
    temple_id = Column(String, ForeignKey("temples.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    count = Column(Integer)
    status = Column(String)
    zone_data = Column(JSON)

    temple = relationship("Temple", back_populates="crowd_data")
