'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { LayerState } from '../layers/LayerControl';
import { ParcelRecord } from '@/scripts/generate_cadastral';
import { INDIA_LOCATION, AdminLocationLevel } from '@/lib/gis/admin_locations';
import { KARJAT_STUDY_AREA } from '@/lib/gis/karjat_study_area';
import { computeBBox } from '@/lib/gis/spatial_queries';
import { FeatureCollection, Polygon } from 'geojson';

interface MapContainerProps {
  layers: LayerState;
  selectedParcel: ParcelRecord | null;
  onSelectParcel: (parcel: ParcelRecord | null) => void;
  parcelsGeoJSON: FeatureCollection | null;
  spatialIntersectsIds: string[];
  adminTarget?: AdminLocationLevel | null;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  layers,
  selectedParcel,
  onSelectParcel,
  parcelsGeoJSON,
  spatialIntersectsIds,
  adminTarget
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize MapLibre GL JS with Esri World Imagery Satellite basemap
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          satellite: {
            type: 'raster',
            tiles: [
              'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: 'Esri World Imagery Satellite | USGS | LandStack GIS'
          },
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{y}/{x}.png'],
            tileSize: 256,
            maxzoom: 19,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'basemap-satellite',
            type: 'raster',
            source: 'satellite',
            layout: { visibility: layers.satellite ? 'visible' : 'none' }
          },
          {
            id: 'basemap-osm',
            type: 'raster',
            source: 'osm',
            layout: { visibility: !layers.satellite ? 'visible' : 'none' }
          }
        ]
      },
      center: INDIA_LOCATION.center,
      zoom: INDIA_LOCATION.zoom,
      maxZoom: 19,
      minZoom: 3
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

    map.on('load', () => {
      mapRef.current = map;
      setMapLoaded(true);
      map.resize();

      // Add Study Area Source & Layer
      map.addSource('study-area-source', {
        type: 'geojson',
        data: KARJAT_STUDY_AREA.geometry as any
      });
      map.addLayer({
        id: 'study-area-layer',
        type: 'line',
        source: 'study-area-source',
        paint: {
          'line-color': '#06B6D4',
          'line-width': 2.5,
          'line-dasharray': [3, 2]
        }
      });
    });

    // ResizeObserver to ensure canvas stays full size
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Basemap Visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (map.getLayer('basemap-satellite')) {
      map.setLayoutProperty('basemap-satellite', 'visibility', layers.satellite ? 'visible' : 'none');
    }
    if (map.getLayer('basemap-osm')) {
      map.setLayoutProperty('basemap-osm', 'visibility', !layers.satellite ? 'visible' : 'none');
    }
  }, [layers.satellite, mapLoaded]);

  // Load Parcels GeoJSON Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !parcelsGeoJSON) return;

    const fillColorExpr: any = spatialIntersectsIds.length > 0
      ? ['case', ['in', ['get', 'parcel_id'], ['literal', spatialIntersectsIds]], '#F59E0B', '#F97316']
      : '#F97316';

    const fillOpacityExpr: any = spatialIntersectsIds.length > 0
      ? ['case', ['in', ['get', 'parcel_id'], ['literal', spatialIntersectsIds]], 0.55, 0.14]
      : 0.14;

    const lineColorExpr: any = spatialIntersectsIds.length > 0
      ? ['case', ['in', ['get', 'parcel_id'], ['literal', spatialIntersectsIds]], '#F59E0B', '#F97316']
      : '#F97316';

    const lineWidthExpr: any = spatialIntersectsIds.length > 0
      ? ['case', ['in', ['get', 'parcel_id'], ['literal', spatialIntersectsIds]], 2.5, 1.2]
      : 1.2;

    if (!map.getSource('parcels-source')) {
      map.addSource('parcels-source', {
        type: 'geojson',
        data: parcelsGeoJSON
      });

      // Parcels Fill
      map.addLayer({
        id: 'parcels-fill',
        type: 'fill',
        source: 'parcels-source',
        paint: {
          'fill-color': fillColorExpr,
          'fill-opacity': fillOpacityExpr
        },
        layout: { visibility: layers.parcels ? 'visible' : 'none' }
      });

      // Parcels Outline
      map.addLayer({
        id: 'parcels-line',
        type: 'line',
        source: 'parcels-source',
        paint: {
          'line-color': lineColorExpr,
          'line-width': lineWidthExpr
        },
        layout: { visibility: layers.parcels ? 'visible' : 'none' }
      });

      // Selected Parcel Layer (Glowing Cyan Highlight)
      map.addLayer({
        id: 'parcels-selected',
        type: 'line',
        source: 'parcels-source',
        filter: ['==', ['get', 'parcel_id'], ''],
        paint: {
          'line-color': '#06B6D4',
          'line-width': 4
        }
      });

      // Survey Number Labels
      map.addLayer({
        id: 'parcels-labels',
        type: 'symbol',
        source: 'parcels-source',
        layout: {
          'text-field': ['get', 'survey_no'],
          'text-size': 11,
          'text-anchor': 'center',
          'visibility': layers.labels ? 'visible' : 'none'
        },
        paint: {
          'text-color': '#FFFFFF',
          'text-halo-color': '#0F172A',
          'text-halo-width': 2
        }
      });

      // Parcel Click Event
      map.on('click', 'parcels-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties as any;
        const geom = e.features[0].geometry as Polygon;
        
        onSelectParcel({
          parcel_id: props.parcel_id,
          ulpin: props.ulpin,
          survey_no: props.survey_no,
          survey_number: props.survey_number || props.survey_no,
          area_acres: Number(props.area_acres),
          village: props.village,
          district: props.district,
          state: props.state,
          zone_id: props.zone_id,
          geometry: geom
        });
      });

      // Cursor Hover
      map.on('mouseenter', 'parcels-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'parcels-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    } else {
      (map.getSource('parcels-source') as GeoJSONSource).setData(parcelsGeoJSON);
    }
  }, [mapLoaded, parcelsGeoJSON]);

  // Update Spatial Intersects Highlights
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !map.getLayer('parcels-fill')) return;

    const fillColorExpr: any = spatialIntersectsIds.length > 0
      ? ['case', ['in', ['get', 'parcel_id'], ['literal', spatialIntersectsIds]], '#F59E0B', '#F97316']
      : '#F97316';

    const fillOpacityExpr: any = spatialIntersectsIds.length > 0
      ? ['case', ['in', ['get', 'parcel_id'], ['literal', spatialIntersectsIds]], 0.55, 0.14]
      : 0.14;

    const lineWidthExpr: any = spatialIntersectsIds.length > 0
      ? ['case', ['in', ['get', 'parcel_id'], ['literal', spatialIntersectsIds]], 2.5, 1.2]
      : 1.2;

    map.setPaintProperty('parcels-fill', 'fill-color', fillColorExpr);
    map.setPaintProperty('parcels-fill', 'fill-opacity', fillOpacityExpr);
    map.setPaintProperty('parcels-line', 'line-width', lineWidthExpr);
  }, [spatialIntersectsIds, mapLoaded]);

  // Handle Layer Visibility Toggles
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (map.getLayer('parcels-fill')) {
      map.setLayoutProperty('parcels-fill', 'visibility', layers.parcels ? 'visible' : 'none');
      map.setLayoutProperty('parcels-line', 'visibility', layers.parcels ? 'visible' : 'none');
    }
    if (map.getLayer('parcels-labels')) {
      map.setLayoutProperty('parcels-labels', 'visibility', layers.labels ? 'visible' : 'none');
    }
  }, [layers.parcels, layers.labels, mapLoaded]);

  // Highlight Selected Parcel & Fly To
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (selectedParcel) {
      if (map.getLayer('parcels-selected')) {
        map.setFilter('parcels-selected', ['==', ['get', 'parcel_id'], selectedParcel.parcel_id]);
      }
      const bbox = computeBBox(selectedParcel.geometry);
      map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 80, maxZoom: 18, duration: 1200 });
    } else {
      if (map.getLayer('parcels-selected')) {
        map.setFilter('parcels-selected', ['==', ['get', 'parcel_id'], '']);
      }
    }
  }, [selectedParcel, mapLoaded]);

  // Handle Administrative Location Camera Navigation
  const prevAdminTargetRef = useRef<string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !adminTarget) return;

    const targetKey = `${adminTarget.id}-${adminTarget.type}`;
    if (prevAdminTargetRef.current === targetKey) return;
    prevAdminTargetRef.current = targetKey;

    if (adminTarget.bounds) {
      map.fitBounds(adminTarget.bounds, {
        padding: 50,
        maxZoom: adminTarget.zoom,
        duration: 1600
      });
    } else {
      map.flyTo({
        center: adminTarget.center,
        zoom: adminTarget.zoom,
        speed: 1.2,
        curve: 1.42,
        essential: true
      });
    }
  }, [adminTarget, mapLoaded]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
