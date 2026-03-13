// app/components/dashboard/PropertyMap.tsx
'use client';

import { useEffect, useRef } from 'react';
import './PropertyMap.css';

interface PropertyMapProps {
  biens: {
    id: number;
    nom: string;
    adresse: string;
    latitude: number;
    longitude: number;
    statut: string;
  }[];
}

export default function PropertyMap({ biens }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulation d'une carte - Dans un projet réel, utiliser Leaflet ou Google Maps
    const mapContainer = mapRef.current;
    if (!mapContainer) return;

    // Remplir avec des marqueurs simulés
    mapContainer.innerHTML = `
      <div style="position: relative; width: 100%; height: 100%; background: #1e293b; border-radius: 12px; overflow: hidden;">
        <img 
          src="https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/2.3522,48.8566,10,0/600x300?access_token=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJja2Rq" 
          alt="Map"
          style="width: 100%; height: 100%; object-fit: cover; opacity: 0.5;"
        />
        <div style="position: absolute; top: 10px; left: 10px; background: #0f172a; padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.3);">
          <span style="color: white; font-size: 12px;">📍 ${biens.length} biens sur la carte</span>
        </div>
      </div>
    `;
  }, [biens]);

  return (
    <div className="property-map">
      <div className="map-header">
        <h3>Carte des biens</h3>
        <button className="map-expand">⛶</button>
      </div>
      
      <div ref={mapRef} className="map-container">
        {/* La carte sera injectée ici */}
      </div>
    </div>
  );
}