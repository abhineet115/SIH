import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, default="ISRO Scientist")
    role = Column(String(50), nullable=False, default="Scientist")  # "Scientist" or "General User"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    query = Column(Text, nullable=False)
    task = Column(String(50), nullable=False)  # "VQA", "GROUNDING", "CHANGE_DETECTION", etc.
    confidence = Column(Float, nullable=False, default=0.0)
    final_answer = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="analyses")
    images = relationship("Image", back_populates="analysis", cascade="all, delete-orphan")
    traces = relationship("ExecutionTrace", back_populates="analysis", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="analysis", cascade="all, delete-orphan")


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    modality = Column(String(50), nullable=False)  # "OPTICAL", "SAR", "MULTISPECTRAL"
    crs = Column(String(50), nullable=False, default="EPSG:32643")
    resolution = Column(String(50), nullable=False, default="10m")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    analysis = relationship("Analysis", back_populates="images")


class ExecutionTrace(Base):
    __tablename__ = "execution_trace"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    step_number = Column(Integer, nullable=False)
    tool_name = Column(String(100), nullable=False)
    model_name = Column(String(100), nullable=True)
    parameters = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="COMPLETED")
    latency_ms = Column(Float, nullable=False, default=0.0)
    details = Column(Text, nullable=True)

    analysis = relationship("Analysis", back_populates="traces")


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    type = Column(String(50), nullable=False)  # "bounding_box", "change_polygon", "fusion_layer"
    data = Column(Text, nullable=False)        # JSON string with coordinates/metrics
    confidence = Column(Float, nullable=False, default=0.0)

    analysis = relationship("Analysis", back_populates="evidence")
