import { Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '@/stores/mapStore';

const userLocationIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-8 h-8 rounded-full bg-blue-500 opacity-30 animate-ping"></div>
      <div class="relative w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center ring-2 ring-blue-400">
        <div class="w-2 h-2 bg-white rounded-full"></div>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

export default function UserLocationMarker() {
  const { userLocation } = useMapStore();

  if (!userLocation) return null;

  return (
    <>
      {/* Accuracy Halo */}
      {userLocation.accuracy && userLocation.accuracy > 5 && (
        <Circle
          center={[userLocation.lat, userLocation.lng]}
          radius={userLocation.accuracy}
          pathOptions={{
            color: '#3B82F6',
            fillColor: '#60A5FA',
            fillOpacity: 0.15,
            weight: 1,
            dashArray: '2 4',
          }}
        />
      )}

      {/* Pulsing User Marker */}
      <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
        <Popup>
          <div className="text-xs p-1">
            <span className="font-bold text-blue-700 flex items-center gap-1">
              <span>📍</span> You Are Here
            </span>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Lat: {userLocation.lat.toFixed(5)}, Lng: {userLocation.lng.toFixed(5)}
            </p>
          </div>
        </Popup>
      </Marker>
    </>
  );
}
