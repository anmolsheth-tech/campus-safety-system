import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useNodes, useBuildings, useEmergencyLocations } from '@/hooks/useCampus';
import { useIncidents } from '@/hooks/useIncidents';
import { useMapStore } from '@/stores/mapStore';
import IncidentMarkers from './IncidentMarkers';
import BuildingMarkers from './BuildingMarkers';
import EmergencyMarkers from './EmergencyMarkers';
import RiskHeatmap from './RiskHeatmap';
import RouteLayer from './RouteLayer';
import UserLocationMarker from './UserLocationMarker';
import MapLayerControls from './MapLayerControls';
import MapLegend from './MapLegend';
import DestinationSelector from './DestinationSelector';
import { Crosshair, Navigation } from 'lucide-react';

const CAMPUS_CENTER: [number, number] = [28.6139, 77.2090];

function LocationControl() {
  const map = useMap();
  const { setUserLocation, userLocation } = useMapStore();
  const [isTracking, setIsTracking] = useState(false);

  const handleLocate = () => {
    setIsTracking(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setUserLocation(coords);
          map.flyTo([coords.lat, coords.lng], 16, { animate: true, duration: 1.2 });
          setIsTracking(false);
        },
        (err) => {
          console.warn('Geolocation error or permission denied, using campus default:', err.message);
          // Fallback to campus center
          setUserLocation({ lat: CAMPUS_CENTER[0], lng: CAMPUS_CENTER[1], accuracy: 20 });
          map.flyTo(CAMPUS_CENTER, 16, { animate: true });
          setIsTracking(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      map.flyTo(CAMPUS_CENTER, 16, { animate: true });
      setIsTracking(false);
    }
  };

  const handleRecenterCampus = () => {
    map.flyTo(CAMPUS_CENTER, 15, { animate: true, duration: 1 });
  };

  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={handleRecenterCampus}
        className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-2.5 hover:bg-slate-50 transition-all border border-slate-200 text-slate-700 hover:text-primary-600"
        title="Recenter to Campus Center"
      >
        <Navigation className="w-5 h-5" />
      </button>

      <button
        onClick={handleLocate}
        className={`bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-2.5 transition-all border border-slate-200 ${
          isTracking ? 'text-primary-600 animate-spin' : 'text-slate-700 hover:text-primary-600 hover:bg-slate-50'
        }`}
        title="Find My Live Location"
      >
        <Crosshair className="w-5 h-5" />
      </button>
    </div>
  );
}

function FitBounds({ bounds }: { bounds: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);
  return null;
}

export default function CampusMap({
  showRoutePanel = true,
  showDestinationSelector = true,
}: {
  showRoutePanel?: boolean;
  showDestinationSelector?: boolean;
}) {
  const { data: nodes } = useNodes();
  const { data: buildings } = useBuildings();
  const { data: emergencyLocations } = useEmergencyLocations();
  const { data: incidentsData } = useIncidents({ per_page: 100 });
  const { showRoute, layers } = useMapStore();

  const incidents = incidentsData?.items || [];

  const bounds: [number, number][] = [];
  if (nodes) {
    nodes.forEach((n) => bounds.push([n.latitude, n.longitude]));
  }
  if (buildings) {
    buildings.forEach((b) => bounds.push([b.latitude, b.longitude]));
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={CAMPUS_CENTER}
        zoom={15}
        className="w-full h-full rounded-2xl overflow-hidden shadow-inner"
        style={{ minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {bounds.length > 0 && <FitBounds bounds={bounds} />}

        {/* 1. Risk Heatmap & Pathway Overlay */}
        {(layers.showHeatmap || layers.showPathways) && (
          <RiskHeatmap
            incidents={incidents}
            showZones={layers.showHeatmap}
            showPathwayRisk={layers.showPathways}
          />
        )}

        {/* 2. Campus Buildings */}
        {layers.showBuildings && <BuildingMarkers buildings={buildings || []} />}

        {/* 3. Emergency Facilities */}
        {layers.showEmergency && <EmergencyMarkers locations={emergencyLocations || []} />}

        {/* 4. Incident Reports */}
        {layers.showIncidents && <IncidentMarkers incidents={incidents} />}

        {/* 5. Safe & Alternate Routes */}
        {showRoute && <RouteLayer />}

        {/* 6. User GPS Beacon */}
        <UserLocationMarker />

        {/* 7. Location Controls */}
        <LocationControl />
      </MapContainer>

      {/* Floating Layer Controls */}
      <MapLayerControls />

      {/* Floating Legend */}
      <MapLegend />

      {/* Destination Quick-Search Overlay */}
      {showDestinationSelector && (
        <div className="absolute top-4 left-4 z-[1000] w-72 sm:w-80">
          <DestinationSelector />
        </div>
      )}
    </div>
  );
}
