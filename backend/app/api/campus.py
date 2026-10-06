from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin
from app.database.session import get_db
from app.models.campus import Building, CampusEdge, CampusNode, EmergencyLocation
from app.schemas.campus import (
    BuildingResponse,
    EdgeCreate,
    EdgeResponse,
    EmergencyLocationResponse,
    NodeCreate,
    NodeResponse,
)

router = APIRouter(prefix="/campus", tags=["campus"])


@router.get("/nodes", response_model=List[NodeResponse])
def list_nodes(db: Session = Depends(get_db)):
    nodes = db.query(CampusNode).all()
    return [NodeResponse.model_validate(n) for n in nodes]


@router.get("/edges", response_model=List[EdgeResponse])
def list_edges(db: Session = Depends(get_db)):
    edges = db.query(CampusEdge).all()
    return [EdgeResponse.model_validate(e) for e in edges]


@router.get("/buildings", response_model=List[BuildingResponse])
def list_buildings(db: Session = Depends(get_db)):
    buildings = db.query(Building).all()
    return [BuildingResponse.model_validate(b) for b in buildings]


@router.get("/emergency-locations", response_model=List[EmergencyLocationResponse])
def list_emergency_locations(db: Session = Depends(get_db)):
    locations = db.query(EmergencyLocation).all()
    return [EmergencyLocationResponse.model_validate(loc) for loc in locations]


@router.post("/nodes", response_model=NodeResponse, status_code=status.HTTP_201_CREATED)
def create_node(
    node_in: NodeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    node = CampusNode(
        name=node_in.name,
        latitude=node_in.latitude,
        longitude=node_in.longitude,
        type=node_in.type,
        building_id=node_in.building_id,
    )
    db.add(node)
    db.commit()
    db.refresh(node)
    return NodeResponse.model_validate(node)


@router.post("/edges", response_model=EdgeResponse, status_code=status.HTTP_201_CREATED)
def create_edge(
    edge_in: EdgeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    source = db.query(CampusNode).filter(CampusNode.id == edge_in.source_id).first()
    dest = db.query(CampusNode).filter(CampusNode.id == edge_in.dest_id).first()
    if not source or not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source or destination node not found",
        )
    edge = CampusEdge(
        source_id=edge_in.source_id,
        dest_id=edge_in.dest_id,
        distance=edge_in.distance,
        travel_time=edge_in.travel_time,
        base_risk_score=edge_in.base_risk_score,
        is_blocked=edge_in.is_blocked,
        is_accessible=edge_in.is_accessible,
        edge_type=edge_in.edge_type,
    )
    db.add(edge)
    db.commit()
    db.refresh(edge)
    return EdgeResponse.model_validate(edge)
