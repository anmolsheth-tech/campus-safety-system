"""
Seed script for Campus Emergency Response & Safe-Route System.
Populates the database with realistic demo data.
Run: python -m app.seed
"""
import math
import random
from datetime import datetime, timedelta, timezone

from app.core.security import get_password_hash
from app.database.base import Base
from app.database.engine import SessionLocal, engine
from app.models.campus import (
    Building,
    CampusEdge,
    CampusNode,
    EmergencyLocation,
    BuildingType,
    EdgeType,
    EmergencyLocationType,
    NodeType,
)
from app.models.incident import (
    Incident,
    IncidentSeverity,
    IncidentStatus,
    IncidentType,
    IncidentUpdate,
)
from app.models.notification import Notification, NotificationType
from app.models.route import RouteRequest, RouteResult, RouteType
from app.models.user import User, UserRole

# Campus center: 28.6139°N, 77.2090°E (Delhi-like area)
CENTER_LAT = 28.6139
CENTER_LON = 77.2090

random.seed(42)


def offset(lat: float, lon: float, dlat: float, dlon: float):
    return lat + dlat, lon + dlon


def meters_to_deg(meters: float) -> float:
    return meters / 111320.0


def seed_users(session):
    student = User(
        email="student@demo.com",
        full_name="Demo Student",
        hashed_password=get_password_hash("password123"),
        role=UserRole.student,
        is_active=True,
        phone="+91-9876543210",
    )
    admin = User(
        email="admin@demo.com",
        full_name="Campus Admin",
        hashed_password=get_password_hash("password123"),
        role=UserRole.admin,
        is_active=True,
        phone="+91-9876543211",
    )
    session.add_all([student, admin])
    session.commit()
    session.refresh(student)
    session.refresh(admin)
    return student, admin


def seed_buildings(session):
    buildings_data = [
        ("Academic Block A", "AA", 0.002, 0.003, "Main academic building with lecture halls", BuildingType.academic),
        ("Academic Block B", "AB", -0.001, 0.004, "Science and engineering labs", BuildingType.academic),
        ("Academic Block C", "AC", 0.004, -0.001, "Humanities and social sciences", BuildingType.academic),
        ("Academic Block D", "AD", -0.003, -0.002, "Computer science department", BuildingType.academic),
        ("Academic Block E", "AE", 0.001, 0.006, "Management and business school", BuildingType.academic),
        ("Academic Block F", "AF", -0.004, 0.001, "Law and research centre", BuildingType.academic),
        ("Central Library", "LIB", 0.0, 0.0, "Main campus library, 4 floors", BuildingType.academic),
        ("Admin Block", "ADM", 0.003, 0.0, "Administrative offices and registrar", BuildingType.admin),
        ("Medical Centre", "MED", -0.002, 0.005, "Campus health services and emergency care", BuildingType.medical),
        ("Sports Complex", "SPT", 0.005, 0.002, "Indoor and outdoor sports facilities", BuildingType.sports),
        ("Boys Hostel 1", "BH1", -0.005, -0.003, "Male residential hall, 200 rooms", BuildingType.residential),
        ("Girls Hostel 1", "GH1", 0.005, -0.004, "Female residential hall, 150 rooms", BuildingType.residential),
        ("Canteen", "CAN", 0.001, -0.003, "Main campus canteen and food court", BuildingType.commercial),
        ("Auditorium", "AUD", -0.001, 0.002, "Main auditorium, 1000 capacity", BuildingType.academic),
        ("Workshop", "WKS", 0.003, -0.005, "Engineering workshops and labs", BuildingType.academic),
    ]

    buildings = []
    for name, code, dlat, dlon, desc, btype in buildings_data:
        b = Building(
            name=name,
            code=code,
            latitude=CENTER_LAT + dlat,
            longitude=CENTER_LON + dlon,
            description=desc,
            building_type=btype,
        )
        buildings.append(b)
    session.add_all(buildings)
    session.commit()
    for b in buildings:
        session.refresh(b)
    return buildings


def seed_nodes(session, buildings):
    nodes_data = [
        # Gate and entrance nodes
        ("Main Gate", CENTER_LAT - 0.006, CENTER_LON, NodeType.gate, None),
        ("North Gate", CENTER_LAT + 0.007, CENTER_LON - 0.001, NodeType.gate, None),
        ("South Gate", CENTER_LAT - 0.007, CENTER_LON + 0.001, NodeType.gate, None),
        ("East Gate", CENTER_LAT, CENTER_LON + 0.008, NodeType.gate, None),
        ("West Gate", CENTER_LAT, CENTER_LON - 0.008, NodeType.gate, None),

        # Building entrances (one per building)
        ("AA Entrance", CENTER_LAT + 0.002, CENTER_LON + 0.0025, NodeType.building_entrance, buildings[0].id),
        ("AB Entrance", CENTER_LAT - 0.001, CENTER_LON + 0.0035, NodeType.building_entrance, buildings[1].id),
        ("AC Entrance", CENTER_LAT + 0.004, CENTER_LON - 0.0015, NodeType.building_entrance, buildings[2].id),
        ("AD Entrance", CENTER_LAT - 0.003, CENTER_LON - 0.0025, NodeType.building_entrance, buildings[3].id),
        ("AE Entrance", CENTER_LAT + 0.001, CENTER_LON + 0.0055, NodeType.building_entrance, buildings[4].id),
        ("AF Entrance", CENTER_LAT - 0.004, CENTER_LON + 0.0015, NodeType.building_entrance, buildings[5].id),
        ("Library Entrance", CENTER_LAT, CENTER_LON - 0.0005, NodeType.building_entrance, buildings[6].id),
        ("Admin Entrance", CENTER_LAT + 0.003, CENTER_LON - 0.0005, NodeType.building_entrance, buildings[7].id),
        ("Medical Entrance", CENTER_LAT - 0.002, CENTER_LON + 0.0045, NodeType.building_entrance, buildings[8].id),
        ("Sports Entrance", CENTER_LAT + 0.005, CENTER_LON + 0.0015, NodeType.building_entrance, buildings[9].id),
        ("BH1 Entrance", CENTER_LAT - 0.005, CENTER_LON - 0.0035, NodeType.building_entrance, buildings[10].id),
        ("GH1 Entrance", CENTER_LAT + 0.005, CENTER_LON - 0.0045, NodeType.building_entrance, buildings[11].id),
        ("Canteen Entrance", CENTER_LAT + 0.001, CENTER_LON - 0.0035, NodeType.building_entrance, buildings[12].id),
        ("Auditorium Entrance", CENTER_LAT - 0.001, CENTER_LON + 0.0015, NodeType.building_entrance, buildings[13].id),
        ("Workshop Entrance", CENTER_LAT + 0.003, CENTER_LON - 0.0055, NodeType.building_entrance, buildings[14].id),

        # Intersections - central campus
        ("Central Plaza", CENTER_LAT, CENTER_LON, NodeType.intersection, None),
        ("North Junction", CENTER_LAT + 0.003, CENTER_LON, NodeType.intersection, None),
        ("South Junction", CENTER_LAT - 0.003, CENTER_LON, NodeType.intersection, None),
        ("East Junction", CENTER_LAT, CENTER_LON + 0.003, NodeType.intersection, None),
        ("West Junction", CENTER_LAT, CENTER_LON - 0.003, NodeType.intersection, None),
        ("NE Junction", CENTER_LAT + 0.003, CENTER_LON + 0.003, NodeType.intersection, None),
        ("NW Junction", CENTER_LAT + 0.003, CENTER_LON - 0.003, NodeType.intersection, None),
        ("SE Junction", CENTER_LAT - 0.003, CENTER_LON + 0.003, NodeType.intersection, None),
        ("SW Junction", CENTER_LAT - 0.003, CENTER_LON - 0.003, NodeType.intersection, None),

        # Path points along walkways
        ("Path A1", CENTER_LAT + 0.001, CENTER_LON + 0.001, NodeType.path_point, None),
        ("Path A2", CENTER_LAT + 0.0015, CENTER_LON + 0.002, NodeType.path_point, None),
        ("Path B1", CENTER_LAT - 0.0005, CENTER_LON + 0.002, NodeType.path_point, None),
        ("Path B2", CENTER_LAT - 0.0015, CENTER_LON + 0.003, NodeType.path_point, None),
        ("Path C1", CENTER_LAT + 0.002, CENTER_LON - 0.001, NodeType.path_point, None),
        ("Path C2", CENTER_LAT + 0.003, CENTER_LON - 0.002, NodeType.path_point, None),
        ("Path D1", CENTER_LAT - 0.002, CENTER_LON - 0.001, NodeType.path_point, None),
        ("Path D2", CENTER_LAT - 0.003, CENTER_LON - 0.002, NodeType.path_point, None),
        ("Path E1", CENTER_LAT + 0.0005, CENTER_LON + 0.004, NodeType.path_point, None),
        ("Path E2", CENTER_LAT + 0.0005, CENTER_LON - 0.004, NodeType.path_point, None),
        ("Path F1", CENTER_LAT - 0.004, CENTER_LON - 0.001, NodeType.path_point, None),
        ("Path F2", CENTER_LAT - 0.005, CENTER_LON + 0.001, NodeType.path_point, None),
        ("Path G1", CENTER_LAT + 0.004, CENTER_LON + 0.001, NodeType.path_point, None),
        ("Path G2", CENTER_LAT + 0.005, CENTER_LON - 0.001, NodeType.path_point, None),
        ("Path H1", CENTER_LAT - 0.001, CENTER_LON - 0.002, NodeType.path_point, None),
        ("Path H2", CENTER_LAT - 0.002, CENTER_LON + 0.001, NodeType.path_point, None),
        ("Path I1", CENTER_LAT + 0.002, CENTER_LON + 0.004, NodeType.path_point, None),
        ("Path J1", CENTER_LAT - 0.004, CENTER_LON + 0.004, NodeType.path_point, None),
        ("Path K1", CENTER_LAT + 0.004, CENTER_LON - 0.004, NodeType.path_point, None),
        ("Path L1", CENTER_LAT - 0.004, CENTER_LON - 0.004, NodeType.path_point, None),

        # Facility nodes
        ("Parking Lot North", CENTER_LAT + 0.006, CENTER_LON, NodeType.facility, None),
        ("Parking Lot South", CENTER_LAT - 0.006, CENTER_LON, NodeType.facility, None),
        ("Sports Field", CENTER_LAT + 0.006, CENTER_LON + 0.003, NodeType.facility, None),
        ("Garden Area", CENTER_LAT - 0.001, CENTER_LON - 0.005, NodeType.facility, None),
        ("Fountain Plaza", CENTER_LAT + 0.002, CENTER_LON + 0.001, NodeType.facility, None),

        # Additional path points for connectivity
        ("Path M1", CENTER_LAT + 0.006, CENTER_LON - 0.002, NodeType.path_point, None),
        ("Path N1", CENTER_LAT - 0.006, CENTER_LON + 0.002, NodeType.path_point, None),
        ("Path O1", CENTER_LAT + 0.001, CENTER_LON - 0.006, NodeType.path_point, None),
        ("Path P1", CENTER_LAT - 0.001, CENTER_LON + 0.006, NodeType.path_point, None),
        ("Path Q1", CENTER_LAT + 0.007, CENTER_LON + 0.001, NodeType.path_point, None),
        ("Path R1", CENTER_LAT - 0.007, CENTER_LON - 0.001, NodeType.path_point, None),
    ]

    nodes = []
    for name, lat, lon, ntype, bid in nodes_data:
        node = CampusNode(
            name=name, latitude=lat, longitude=lon, type=ntype, building_id=bid
        )
        nodes.append(node)
    session.add_all(nodes)
    session.commit()
    for n in nodes:
        session.refresh(n)
    return nodes


def calc_distance(lat1, lon1, lat2, lon2):
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def seed_edges(session, nodes):
    node_map = {n.name: n for n in nodes}
    edges_data = [
        # Gate to nearby junctions/paths
        ("Main Gate", "South Junction", EdgeType.road, 0.0),
        ("Main Gate", "Path D2", EdgeType.walkway, 0.0),
        ("North Gate", "North Junction", EdgeType.road, 0.0),
        ("North Gate", "Path Q1", EdgeType.walkway, 0.0),
        ("South Gate", "South Junction", EdgeType.road, 0.0),
        ("South Gate", "Path R1", EdgeType.walkway, 0.0),
        ("East Gate", "East Junction", EdgeType.road, 0.0),
        ("East Gate", "Path E1", EdgeType.walkway, 0.0),
        ("West Gate", "West Junction", EdgeType.road, 0.0),
        ("West Gate", "Path O1", EdgeType.walkway, 0.0),

        # Central connections
        ("Central Plaza", "North Junction", EdgeType.walkway, 0.0),
        ("Central Plaza", "South Junction", EdgeType.walkway, 0.0),
        ("Central Plaza", "East Junction", EdgeType.walkway, 0.0),
        ("Central Plaza", "West Junction", EdgeType.walkway, 0.0),
        ("Central Plaza", "Path A1", EdgeType.walkway, 0.0),
        ("Central Plaza", "Path C1", EdgeType.walkway, 0.0),
        ("Central Plaza", "Path D1", EdgeType.walkway, 0.0),
        ("Central Plaza", "Path H1", EdgeType.walkway, 0.0),
        ("Central Plaza", "Library Entrance", EdgeType.corridor, 0.0),
        ("Central Plaza", "Fountain Plaza", EdgeType.walkway, 0.0),

        # Junction to junction
        ("North Junction", "NE Junction", EdgeType.walkway, 0.0),
        ("North Junction", "NW Junction", EdgeType.walkway, 0.0),
        ("South Junction", "SE Junction", EdgeType.walkway, 0.0),
        ("South Junction", "SW Junction", EdgeType.walkway, 0.0),
        ("East Junction", "NE Junction", EdgeType.walkway, 0.0),
        ("East Junction", "SE Junction", EdgeType.walkway, 0.0),
        ("West Junction", "NW Junction", EdgeType.walkway, 0.0),
        ("West Junction", "SW Junction", EdgeType.walkway, 0.0),

        # To building entrances
        ("North Junction", "Path A2", EdgeType.walkway, 0.0),
        ("Path A2", "AA Entrance", EdgeType.walkway, 0.0),
        ("NE Junction", "AE Entrance", EdgeType.walkway, 0.0),
        ("Path E1", "AE Entrance", EdgeType.walkway, 0.0),
        ("North Junction", "AB Entrance", EdgeType.walkway, 0.0),
        ("Path B1", "AB Entrance", EdgeType.walkway, 0.0),
        ("NW Junction", "AF Entrance", EdgeType.walkway, 0.0),
        ("Path F1", "AF Entrance", EdgeType.walkway, 0.0),
        ("East Junction", "AC Entrance", EdgeType.walkway, 0.0),
        ("Path C2", "AC Entrance", EdgeType.walkway, 0.0),
        ("SW Junction", "AD Entrance", EdgeType.walkway, 0.0),
        ("Path D2", "AD Entrance", EdgeType.walkway, 0.0),
        ("Path H2", "Medical Entrance", EdgeType.walkway, 0.0),
        ("SE Junction", "Medical Entrance", EdgeType.walkway, 0.0),
        ("Path G1", "Sports Entrance", EdgeType.walkway, 0.0),
        ("Path G2", "Sports Entrance", EdgeType.walkway, 0.0),
        ("Path H1", "BH1 Entrance", EdgeType.walkway, 0.0),
        ("SW Junction", "BH1 Entrance", EdgeType.walkway, 0.0),
        ("Path E2", "GH1 Entrance", EdgeType.walkway, 0.0),
        ("Path K1", "GH1 Entrance", EdgeType.walkway, 0.0),
        ("Path D1", "Canteen Entrance", EdgeType.walkway, 0.0),
        ("Path H2", "Canteen Entrance", EdgeType.walkway, 0.0),
        ("Path B1", "Auditorium Entrance", EdgeType.walkway, 0.0),
        ("Path A1", "Auditorium Entrance", EdgeType.walkway, 0.0),
        ("Path C1", "Workshop Entrance", EdgeType.walkway, 0.0),
        ("SE Junction", "Workshop Entrance", EdgeType.walkway, 0.0),

        # Internal path connections
        ("Path A1", "Path A2", EdgeType.walkway, 0.0),
        ("Path B1", "Path B2", EdgeType.walkway, 0.0),
        ("Path C1", "Path C2", EdgeType.walkway, 0.0),
        ("Path D1", "Path D2", EdgeType.walkway, 0.0),
        ("Path F1", "Path F2", EdgeType.walkway, 0.0),
        ("Path G1", "Path G2", EdgeType.walkway, 0.0),
        ("Path I1", "AE Entrance", EdgeType.walkway, 0.0),
        ("Path I1", "NE Junction", EdgeType.walkway, 0.0),
        ("Path J1", "NW Junction", EdgeType.walkway, 0.0),
        ("Path J1", "Path F2", EdgeType.walkway, 0.0),

        # Facility connections
        ("North Junction", "Parking Lot North", EdgeType.road, 0.0),
        ("Path Q1", "Parking Lot North", EdgeType.road, 0.0),
        ("South Junction", "Parking Lot South", EdgeType.road, 0.0),
        ("Path R1", "Parking Lot South", EdgeType.road, 0.0),
        ("NE Junction", "Sports Field", EdgeType.walkway, 0.0),
        ("Path M1", "Sports Field", EdgeType.walkway, 0.0),
        ("Path M1", "Parking Lot North", EdgeType.walkway, 0.0),
        ("Path N1", "Parking Lot South", EdgeType.walkway, 0.0),
        ("South Junction", "Path N1", EdgeType.walkway, 0.0),
        ("Path L1", "Garden Area", EdgeType.walkway, 0.0),
        ("SW Junction", "Garden Area", EdgeType.walkway, 0.0),
        ("Path O1", "Garden Area", EdgeType.walkway, 0.0),
        ("Path P1", "Medical Entrance", EdgeType.walkway, 0.0),
        ("East Junction", "Path P1", EdgeType.walkway, 0.0),

        # Cross-campus connections
        ("Parking Lot North", "North Gate", EdgeType.road, 0.0),
        ("Parking Lot South", "South Gate", EdgeType.road, 0.0),
        ("Sports Field", "East Gate", EdgeType.walkway, 0.0),
        ("Garden Area", "West Gate", EdgeType.walkway, 0.0),

        # Additional connectivity
        ("Path B2", "Path P1", EdgeType.walkway, 0.0),
        ("Path C2", "Path G1", EdgeType.walkway, 0.0),
        ("Path E2", "Path O1", EdgeType.walkway, 0.0),
        ("Path F1", "Path L1", EdgeType.walkway, 0.0),
        ("NE Junction", "East Gate", EdgeType.walkway, 0.0),
        ("NW Junction", "Path J1", EdgeType.walkway, 0.0),
    ]

    edges = []
    for src_name, dst_name, etype, base_risk in edges_data:
        src = node_map.get(src_name)
        dst = node_map.get(dst_name)
        if not src or not dst:
            continue
        dist = calc_distance(src.latitude, src.longitude, dst.latitude, dst.longitude)
        travel_time = dist / 80.0  # ~80 m/min walking speed
        edge = CampusEdge(
            source_id=src.id,
            dest_id=dst.id,
            distance=round(dist, 1),
            travel_time=round(travel_time, 2),
            base_risk_score=base_risk,
            is_blocked=False,
            is_accessible=True,
            edge_type=etype,
        )
        edges.append(edge)

    session.add_all(edges)
    session.commit()
    for e in edges:
        session.refresh(e)
    return edges


def seed_emergency_locations(session):
    locations_data = [
        ("Main Security Office", EmergencyLocationType.security_office, 0.005, -0.001, "+91-11-23456789", "24/7 security command center"),
        ("Campus Medical Centre", EmergencyLocationType.medical_centre, -0.002, 0.005, "+91-11-23456790", "Full medical facility with ambulance"),
        ("North Police Post", EmergencyLocationType.police_post, 0.007, -0.001, "100", "Delhi Police campus outpost"),
        ("Fire Station", EmergencyLocationType.fire_safety, -0.005, 0.002, "101", "Campus fire brigade"),
        ("Main Assembly Point", EmergencyLocationType.assembly_point, 0.0, -0.005, None, "Primary evacuation point"),
        ("East Assembly Point", EmergencyLocationType.assembly_point, 0.003, 0.006, None, "Secondary evacuation point"),
        ("Main Gate Security", EmergencyLocationType.main_gate, -0.006, 0.0, "+91-11-23456791", "Main entrance security desk"),
        ("Medical Emergency Kit", EmergencyLocationType.medical_centre, 0.003, 0.003, "+91-11-23456792", "First aid station near sports complex"),
    ]

    locations = []
    for name, ltype, dlat, dlon, phone, desc in locations_data:
        loc = EmergencyLocation(
            name=name,
            type=ltype,
            latitude=CENTER_LAT + dlat,
            longitude=CENTER_LON + dlon,
            phone=phone,
            description=desc,
            is_active=True,
        )
        locations.append(loc)
    session.add_all(locations)
    session.commit()
    return locations


def seed_incidents(session, student, admin):
    now = datetime.now(timezone.utc)
    incidents_data = [
        # Active/Verified incidents (will affect routing)
        (IncidentType.fire, IncidentSeverity.critical, "Small fire reported in chemistry lab, smoke visible from corridor", 0.0025, 0.0032, "Academic Block A", IncidentStatus.active, True, 0),
        (IncidentType.flood, IncidentSeverity.high, "Water pipe burst in basement, flooding walkway near south entrance", -0.0015, 0.0032, "Academic Block B", IncidentStatus.active, True, 0),
        (IncidentType.accident, IncidentSeverity.moderate, "Bicycle collision, minor injuries, student being treated", -0.003, 0.001, "SW Junction", IncidentStatus.verified, True, 0),
        (IncidentType.blockage, IncidentSeverity.low, "Construction materials blocking part of the east pathway", 0.0, 0.0035, "East Junction", IncidentStatus.verified, True, 0),
        (IncidentType.suspicious, IncidentSeverity.high, "Unattended bag near north gate, security investigating", 0.007, -0.0008, "North Gate", IncidentStatus.active, True, 0),
        (IncidentType.harassment, IncidentSeverity.high, "Report of verbal harassment near canteen area", 0.001, -0.0033, "Canteen", IncidentStatus.verified, True, -1),
        (IncidentType.medical, IncidentSeverity.critical, "Student collapsed during sports activity, ambulance called", 0.0055, 0.0025, "Sports Complex", IncidentStatus.active, True, 0),
        (IncidentType.other, IncidentSeverity.moderate, "Power outage affecting academic blocks C and D", 0.001, -0.0015, "Central Plaza", IncidentStatus.verified, True, -1),
        (IncidentType.fire, IncidentSeverity.high, "Electrical sparking from overhead wire, area cordoned", -0.004, 0.0012, "Path F1", IncidentStatus.active, True, -1),
        (IncidentType.accident, IncidentSeverity.low, "Fallen tree branch partially blocking south pathway", -0.006, 0.001, "South Gate", IncidentStatus.verified, True, -2),

        # Historical - resolved
        (IncidentType.medical, IncidentSeverity.moderate, "Student felt dizzy in library, given first aid", 0.0, 0.0, "Central Library", IncidentStatus.resolved, True, -1),
        (IncidentType.accident, IncidentSeverity.low, "Minor slip on wet floor near canteen", 0.001, -0.0032, "Canteen", IncidentStatus.resolved, True, -2),
        (IncidentType.suspicious, IncidentSeverity.moderate, "Strange noises reported from empty classroom", -0.003, -0.002, "Academic Block D", IncidentStatus.resolved, True, -3),
        (IncidentType.flood, IncidentSeverity.high, "Heavy rain caused waterlogging in south campus", -0.005, -0.002, "Boys Hostel Area", IncidentStatus.resolved, True, -5),
        (IncidentType.harassment, IncidentSeverity.critical, "Serious harassment complaint, police involved", 0.003, 0.0, "Admin Block", IncidentStatus.resolved, True, -7),
        (IncidentType.fire, IncidentSeverity.moderate, "Cooking smoke triggered fire alarm in canteen", 0.0012, -0.0031, "Canteen", IncidentStatus.resolved, True, -4),
        (IncidentType.other, IncidentSeverity.low, "Lost and found - laptop bag in auditorium", -0.001, 0.0018, "Auditorium", IncidentStatus.resolved, True, -6),
        (IncidentType.accident, IncidentSeverity.high, "Auto-rickshaw hit pedestrian near south gate", -0.0065, 0.0008, "South Gate", IncidentStatus.resolved, True, -8),
        (IncidentType.medical, IncidentSeverity.low, "Student had allergic reaction, EpiPen administered", -0.002, 0.0048, "Medical Centre", IncidentStatus.resolved, True, -10),
        (IncidentType.suspicious, IncidentSeverity.moderate, "Unauthorized person entering restricted area", 0.004, -0.004, "Workshop", IncidentStatus.resolved, True, -12),

        # More historical
        (IncidentType.blockage, IncidentSeverity.low, "Event setup blocking corridor in auditorium", -0.0012, 0.0016, "Auditorium", IncidentStatus.resolved, True, -15),
        (IncidentType.flood, IncidentSeverity.moderate, "AC unit leaking water in admin building", 0.0031, 0.0001, "Admin Block", IncidentStatus.resolved, True, -18),
        (IncidentType.accident, IncidentSeverity.low, "Student tripped on stairs in library", 0.0001, -0.0006, "Central Library", IncidentStatus.resolved, True, -20),
        (IncidentType.fire, IncidentSeverity.critical, "Chemical fire in research lab, building evacuated", 0.0022, 0.0028, "Academic Block A", IncidentStatus.resolved, True, -25),
        (IncidentType.suspicious, IncidentSeverity.high, "Break-in attempt at girls hostel", 0.0051, -0.0046, "Girls Hostel 1", IncidentStatus.resolved, True, -30),
        (IncidentType.medical, IncidentSeverity.high, "Mass food poisoning from canteen, 15 students affected", 0.0011, -0.0034, "Canteen", IncidentStatus.resolved, True, -35),
        (IncidentType.harassment, IncidentSeverity.moderate, "Stalking reported near parking area", 0.0058, 0.0002, "Parking Lot North", IncidentStatus.resolved, True, -40),
        (IncidentType.other, IncidentSeverity.low, "Noise complaint from construction work", 0.0033, -0.0053, "Workshop", IncidentStatus.rejected, True, -45),
        (IncidentType.accident, IncidentSeverity.moderate, "Car bumped into campus wall near gate", 0.0, 0.0078, "East Gate", IncidentStatus.resolved, True, -50),
        (IncidentType.flood, IncidentSeverity.low, "Minor water seepage in basement storage", -0.0032, -0.0023, "Academic Block D", IncidentStatus.rejected, True, -55),

        # More resolved incidents for stats
        (IncidentType.medical, IncidentSeverity.moderate, "Student injury during sports practice", 0.0052, 0.0018, "Sports Complex", IncidentStatus.resolved, True, -60),
        (IncidentType.fire, IncidentSeverity.low, "Burnt toast triggered smoke detector", 0.0013, -0.0028, "Canteen", IncidentStatus.resolved, True, -65),
        (IncidentType.accident, IncidentSeverity.critical, "Major road accident near main gate involving campus bus", -0.0058, 0.0002, "Main Gate", IncidentStatus.resolved, True, -70),
        (IncidentType.suspicious, IncidentSeverity.low, "Forgotten backpack investigated, nothing suspicious", 0.002, 0.001, "Fountain Plaza", IncidentStatus.resolved, True, -75),
        (IncidentType.harassment, IncidentSeverity.high, "Online harassment complaint by student", -0.001, 0.0022, "Auditorium", IncidentStatus.resolved, True, -80),
        (IncidentType.blockage, IncidentSeverity.moderate, "Fallen power line blocking north path", 0.0045, 0.0005, "Path Q1", IncidentStatus.resolved, True, -85),
        (IncidentType.other, IncidentSeverity.moderate, "Chemical spill in lab, hazmat team called", 0.0028, 0.0031, "Academic Block B", IncidentStatus.resolved, True, -90),
        (IncidentType.medical, IncidentSeverity.critical, "Cardiac emergency, student rushed to hospital", 0.0, 0.0002, "Central Plaza", IncidentStatus.resolved, True, -95),
        (IncidentType.flood, IncidentSeverity.high, "Storm drain overflow, campus paths flooded", -0.002, -0.001, "Path D1", IncidentStatus.resolved, True, -100),
        (IncidentType.accident, IncidentSeverity.low, "Falling branch damaged parked bicycle", 0.006, -0.003, "BH1 Entrance", IncidentStatus.resolved, True, -105),
        (IncidentType.suspicious, IncidentSeverity.moderate, "Unauthorized drone spotted over campus", 0.001, 0.005, "Path E1", IncidentStatus.resolved, True, -110),
        (IncidentType.fire, IncidentSeverity.high, "Generator room fire, quick response contained it", -0.005, 0.0015, "Path F2", IncidentStatus.resolved, True, -115),
        (IncidentType.harassment, IncidentSeverity.low, "Verbal dispute between students resolved by counselor", 0.003, -0.001, "Path C2", IncidentStatus.resolved, True, -120),
        (IncidentType.other, IncidentSeverity.low, "Campus WiFi outage reported and fixed", 0.0002, 0.0003, "Central Library", IncidentStatus.resolved, True, -125),
        (IncidentType.accident, IncidentSeverity.moderate, "Lab equipment malfunction, no injuries", -0.0008, 0.0038, "Academic Block B", IncidentStatus.resolved, True, -130),
        (IncidentType.medical, IncidentSeverity.low, "Student with sprained ankle treated at medical centre", -0.0018, 0.0047, "Medical Centre", IncidentStatus.resolved, True, -135),
        (IncidentType.blockage, IncidentSeverity.high, "Major construction blocking main walkway for 3 days", 0.0015, 0.0015, "Path A1", IncidentStatus.resolved, True, -140),
        (IncidentType.flood, IncidentSeverity.moderate, "Rooftop water tank overflow, dripping on stairs", -0.0035, -0.0018, "Academic Block D", IncidentStatus.resolved, True, -145),
    ]

    incidents = []
    for i, (itype, sev, desc, dlat, dlon, loc_name, istatus, verified, days_offset) in enumerate(incidents_data):
        created = now + timedelta(days=days_offset, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        reporter = student if i % 3 != 0 else admin
        inc = Incident(
            type=itype,
            severity=sev,
            description=desc,
            latitude=CENTER_LAT + dlat,
            longitude=CENTER_LON + dlon,
            location_name=loc_name,
            status=istatus,
            reporter_id=reporter.id,
            verified_by=admin.id if verified else None,
            created_at=created,
            updated_at=created + timedelta(hours=random.randint(1, 48)),
            resolved_at=(created + timedelta(hours=random.randint(2, 72))) if istatus == IncidentStatus.resolved else None,
            is_verified=verified,
        )
        incidents.append(inc)

    session.add_all(incidents)
    session.commit()
    for inc in incidents:
        session.refresh(inc)
    return incidents


def seed_notifications(session, student, admin, incidents):
    now = datetime.now(timezone.utc)
    notifs_data = [
        (admin.id, "New Incident Reported", "A fire incident has been reported at Academic Block A", NotificationType.danger, incidents[0].id, 1),
        (student.id, "Route Warning", "High risk area detected on your usual route to the library", NotificationType.warning, None, 2),
        (admin.id, "Incident Verified", "The flood incident at Academic Block B has been verified", NotificationType.info, incidents[1].id, 3),
        (student.id, "Safety Alert", "Please avoid the east pathway due to construction", NotificationType.warning, incidents[3].id, 4),
        (admin.id, "SOS Alert", "Emergency SOS triggered near Sports Complex", NotificationType.danger, incidents[6].id, 0),
        (student.id, "Incident Resolved", "The waterlogging issue has been resolved", NotificationType.success, incidents[14].id, 5),
        (admin.id, "New Report", "Suspicious activity reported near North Gate", NotificationType.warning, incidents[4].id, 1),
        (student.id, "Campus Update", "Power restored in academic blocks C and D", NotificationType.success, incidents[7].id, 6),
        (student.id, "Safety Reminder", "Always verify your route before heading to classes", NotificationType.info, None, 10),
        (admin.id, "Weekly Report", "15 incidents reported this week, 12 resolved", NotificationType.info, None, 7),
        (student.id, "Medical Alert", "Medical emergency at Sports Complex - avoid area", NotificationType.danger, incidents[6].id, 0),
        (admin.id, "Verification Pending", "3 incidents awaiting verification", NotificationType.info, None, 2),
        (student.id, "Route Advisory", "Safer route available via north pathway", NotificationType.info, None, 3),
        (admin.id, "Fire Incident", "Fire reported at Path F1 area - electrical sparking", NotificationType.danger, incidents[8].id, 1),
        (student.id, "Blocked Path", "South pathway partially blocked near gate", NotificationType.warning, incidents[9].id, 4),
        (admin.id, "Analytics Update", "Monthly incident trends show 20% decrease", NotificationType.success, None, 15),
        (student.id, "Welcome", "Welcome to Campus Safety System. Stay safe!", NotificationType.info, None, 30),
        (admin.id, "System Alert", "Database backup completed successfully", NotificationType.success, None, 1),
        (student.id, "Harassment Report", "Incident near canteen under investigation", NotificationType.warning, incidents[5].id, 1),
        (admin.id, "All Clear", "North Gate incident resolved - all clear", NotificationType.success, incidents[4].id, 2),
    ]

    notifs = []
    for user_id, title, message, ntype, inc_id, days_offset in notifs_data:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=ntype,
            incident_id=inc_id,
            is_read=random.random() > 0.4,
            created_at=now - timedelta(days=days_offset, hours=random.randint(0, 12)),
        )
        notifs.append(notif)

    session.add_all(notifs)
    session.commit()
    return notifs


def seed(target_engine=None, target_session=None, verbose=True):
    from app.database.engine import engine as default_engine, SessionLocal as DefaultSessionLocal

    use_engine = target_engine or default_engine
    Base.metadata.drop_all(bind=use_engine)
    Base.metadata.create_all(bind=use_engine)

    session = target_session or DefaultSessionLocal()
    own_session = target_session is None
    try:
        if verbose:
            print("Seeding users...")
        student, admin = seed_users(session)
        if verbose:
            print(f"  Created: {student.email}, {admin.email}")

        if verbose:
            print("Seeding buildings...")
        buildings = seed_buildings(session)
        if verbose:
            print(f"  Created {len(buildings)} buildings")

        if verbose:
            print("Seeding campus nodes...")
        nodes = seed_nodes(session, buildings)
        if verbose:
            print(f"  Created {len(nodes)} nodes")

        if verbose:
            print("Seeding campus edges...")
        edges = seed_edges(session, nodes)
        if verbose:
            print(f"  Created {len(edges)} edges")

        if verbose:
            print("Seeding emergency locations...")
        locations = seed_emergency_locations(session)
        if verbose:
            print(f"  Created {len(locations)} emergency locations")

        if verbose:
            print("Seeding incidents...")
        incidents = seed_incidents(session, student, admin)
        if verbose:
            print(f"  Created {len(incidents)} incidents")

        if verbose:
            print("Seeding notifications...")
        notifs = seed_notifications(session, student, admin, incidents)
        if verbose:
            print(f"  Created {len(notifs)} notifications")

        if verbose:
            print("\nSeed completed successfully!")
            print("  Student login: student@demo.com / password123")
            print("  Admin login: admin@demo.com / password123")

    finally:
        if own_session:
            session.close()


if __name__ == "__main__":
    seed()
