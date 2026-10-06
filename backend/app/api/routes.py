from typing import Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.route import RouteRequest, RouteResult, RouteType
from app.models.user import User
from app.schemas.route import RouteComparison, RouteRequestCreate, RouteResponse
from app.services import route_service, notification_service

router = APIRouter(prefix="/routes", tags=["routes"])


def _save_route(
    db: Session,
    user_id: int,
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
    route_type: str,
    result_data: Dict,
) -> None:
    request = RouteRequest(
        user_id=user_id,
        origin_lat=origin_lat,
        origin_lon=origin_lon,
        dest_lat=dest_lat,
        dest_lon=dest_lon,
        route_type=route_type,
    )
    db.add(request)
    db.flush()

    route_result = RouteResult(
        request_id=request.id,
        total_distance=result_data["total_distance"],
        total_time=result_data["total_time"],
        risk_score=result_data["risk_score"],
        risk_level=result_data["risk_level"],
        path_nodes=result_data["path_nodes"],
        path_coordinates=result_data["path_coordinates"],
        explanation=result_data.get("explanation"),
        alternative_available=result_data.get("alternative_available", False),
    )
    db.add(route_result)
    db.commit()


@router.post("/recommend", response_model=RouteResponse)
def recommend_route(
    req: RouteRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = route_service.compute_recommended_route(
        db, req.origin_lat, req.origin_lon, req.dest_lat, req.dest_lon
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No route found between the given locations",
        )

    _save_route(db, current_user.id, req.origin_lat, req.origin_lon,
                req.dest_lat, req.dest_lon, "recommended", result)

    if result.get("risk_level") in ("high", "critical"):
        notification_service.notify_route_warning(
            db, current_user.id, result["risk_level"],
            f"Risk score: {result['risk_score']:.2f}",
        )

    return RouteResponse(**result)


@router.get("/shortest", response_model=RouteResponse)
def shortest_route(
    origin_lat: float = Query(...),
    origin_lon: float = Query(...),
    dest_lat: float = Query(...),
    dest_lon: float = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = route_service.compute_shortest_route(
        db, origin_lat, origin_lon, dest_lat, dest_lon
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No route found between the given locations",
        )
    return RouteResponse(**result)


@router.get("/safest", response_model=RouteResponse)
def safest_route(
    origin_lat: float = Query(...),
    origin_lon: float = Query(...),
    dest_lat: float = Query(...),
    dest_lon: float = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = route_service.compute_safest_route(
        db, origin_lat, origin_lon, dest_lat, dest_lon
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No route found between the given locations",
        )
    return RouteResponse(**result)


@router.post("/compare", response_model=RouteComparison)
def compare_routes(
    req: RouteRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shortest = route_service.compute_shortest_route(
        db, req.origin_lat, req.origin_lon, req.dest_lat, req.dest_lon
    )
    safest = route_service.compute_safest_route(
        db, req.origin_lat, req.origin_lon, req.dest_lat, req.dest_lon
    )
    recommended = route_service.compute_recommended_route(
        db, req.origin_lat, req.origin_lon, req.dest_lat, req.dest_lon
    )

    if not shortest and not safest and not recommended:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No routes found between the given locations",
        )

    shortest_resp = RouteResponse(**shortest) if shortest else RouteResponse(
        total_distance=0, total_time=0, risk_score=0, risk_level="low",
        path_nodes=[], path_coordinates=[], alternative_available=False,
    )
    safest_resp = RouteResponse(**safest) if safest else RouteResponse(
        total_distance=0, total_time=0, risk_score=0, risk_level="low",
        path_nodes=[], path_coordinates=[], alternative_available=False,
    )
    recommended_resp = RouteResponse(**recommended) if recommended else RouteResponse(
        total_distance=0, total_time=0, risk_score=0, risk_level="low",
        path_nodes=[], path_coordinates=[], alternative_available=False,
    )

    summary = "Route comparison complete."
    if recommended and recommended.get("explanation"):
        summary = recommended["explanation"].get("summary", summary)

    return RouteComparison(
        shortest=shortest_resp,
        safest=safest_resp,
        recommended=recommended_resp,
        summary=summary,
    )
