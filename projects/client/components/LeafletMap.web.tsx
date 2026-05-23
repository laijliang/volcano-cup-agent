import { useEffect, useRef } from 'react';
import { View } from 'react-native';

// ── Load leaflet from CDN (avoids Metro module resolution issues with pnpm symlinks) ──

function injectLeaflet(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).L) { resolve(); return; }

    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const jsId = 'leaflet-js';
    if (!document.getElementById(jsId)) {
      const script = document.createElement('script');
      script.id = jsId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    } else {
      resolve();
    }
  });
}

// ── Types ──

interface Anchor {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'landmark' | 'food' | 'secret';
  checked: boolean;
  region_id: string;
  unlocked: boolean;
  description?: string;
}

interface LeafletMapProps {
  anchors: Anchor[];
  selectedAnchorId: string | null;
  onSelectAnchor: (anchor: Anchor) => void;
  centerLat: number;
  centerLng: number;
}

// ── Component ──

export default function LeafletMap({
  anchors,
  selectedAnchorId,
  onSelectAnchor,
  centerLat,
  centerLng,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const onSelectRef = useRef(onSelectAnchor);
  onSelectRef.current = onSelectAnchor;

  // Init map on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      await injectLeaflet();
      if (cancelled) return;

      const L = (window as any).L;
      const el = containerRef.current;
      if (!el || !L) return;

      const map = L.map(el, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      mapRef.current = map;
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // Fly to new center when region changes
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      map.flyTo([centerLat, centerLng], 14, { duration: 0.6 });
    }
  }, [centerLat, centerLng]);

  // Update markers when anchors or selection changes
  useEffect(() => {
    const map = mapRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    // Clear old markers
    markersRef.current.forEach((m: any) => map.removeLayer(m));
    markersRef.current = [];

    anchors.forEach((anchor) => {
      const isSelected = selectedAnchorId === anchor.id;
      const size: [number, number] = isSelected ? [36, 54] : [28, 42];
      const anchorPt: [number, number] = isSelected ? [14, 50] : [11, 39];
      const color = anchor.checked ? '#3FB950'
        : anchor.type === 'landmark' ? '#8B4513'
        : anchor.type === 'food' ? '#E85D4C'
        : '#9370DB';

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width:${size[0]}px;height:${size[1]}px;
          background:${color};border:3px solid #fff;
          border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: size,
        iconAnchor: anchorPt,
        popupAnchor: [0, -size[1]],
      });

      const marker = L.marker([anchor.latitude, anchor.longitude], { icon })
        .addTo(map)
        .on('click', () => onSelectRef.current(anchor));

      if (anchor.description) {
        const checkedBadge = anchor.checked
          ? '<span style="display:inline-block;margin-top:6px;padding:2px 8px;background:#E8F5E9;color:#2D7D46;border-radius:10px;font-size:11px;font-weight:600;">✓ 已打卡</span>'
          : '';

        marker.bindPopup(`
          <div style="font-family:system-ui,sans-serif;padding:4px;min-width:120px">
            <strong style="font-size:14px">${anchor.name}</strong>
            <div style="font-size:12px;color:#666;margin-top:4px">${anchor.description || ''}</div>
            ${checkedBadge}
          </div>
        `);
      }

      markersRef.current.push(marker);
    });
  }, [anchors, selectedAnchorId]);

  return (
    <View
      ref={containerRef as any}
      style={{
        height: 280,
        margin: 16,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0E0E0',
      }}
    />
  );
}
