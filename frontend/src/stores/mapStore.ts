import { create } from 'zustand';

const CAMPUS_DEFAULT = { lat: 28.6139, lng: 77.2090, name: 'Campus Center (Main Gate)' };

export interface MapLayerState {
  showHeatmap: boolean;
  showIncidents: boolean;
  showBuildings: boolean;
  showEmergency: boolean;
  showPathways: boolean;
  showComparisonRoutes: boolean;
}

interface MapState {
  selectedDestination: { lat: number; lng: number; name: string } | null;
  selectedOrigin: { lat: number; lng: number; name: string } | null;
  userLocation: { lat: number; lng: number; accuracy?: number } | null;
  showRoute: boolean;
  routeType: 'recommended' | 'safest' | 'shortest';
  layers: MapLayerState;
  
  setSelectedDestination: (dest: { lat: number; lng: number; name: string } | null) => void;
  setSelectedOrigin: (origin: { lat: number; lng: number; name: string } | null) => void;
  setUserLocation: (loc: { lat: number; lng: number; accuracy?: number } | null) => void;
  setShowRoute: (show: boolean) => void;
  setRouteType: (type: 'recommended' | 'safest' | 'shortest') => void;
  toggleLayer: (layer: keyof MapLayerState) => void;
  setLayer: (layer: keyof MapLayerState, enabled: boolean) => void;
  swapOriginDestination: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedDestination: null,
  selectedOrigin: CAMPUS_DEFAULT,
  userLocation: { lat: CAMPUS_DEFAULT.lat, lng: CAMPUS_DEFAULT.lng, accuracy: 15 },
  showRoute: false,
  routeType: 'recommended',
  layers: {
    showHeatmap: true,
    showIncidents: true,
    showBuildings: true,
    showEmergency: true,
    showPathways: true,
    showComparisonRoutes: true,
  },
  setSelectedDestination: (dest) => set({ selectedDestination: dest }),
  setSelectedOrigin: (origin) => set({ selectedOrigin: origin }),
  setUserLocation: (loc) => set({ userLocation: loc }),
  setShowRoute: (show) => set({ showRoute: show }),
  setRouteType: (type) => set({ routeType: type }),
  toggleLayer: (layer) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layer]: !state.layers[layer],
      },
    })),
  setLayer: (layer, enabled) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layer]: enabled,
      },
    })),
  swapOriginDestination: () =>
    set((state) => ({
      selectedOrigin: state.selectedDestination,
      selectedDestination: state.selectedOrigin,
    })),
}));
