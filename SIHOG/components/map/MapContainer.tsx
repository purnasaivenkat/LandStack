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
  parcelList?: ParcelRecord[];
  spatialIntersectsIds: string[];
  adminTarget?: AdminLocationLevel | null;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  layers,
  selectedParcel,
  onSelectParcel,
  parcelsGeoJSON,
  parcelList = [],
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
      center: KARJAT_STUDY_AREA.center,
      zoom: 15.0,
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

  // Refs to always access latest props in MapLibre event handlers
  const onSelectParcelRef = useRef(onSelectParcel);
  onSelectParcelRef.current = onSelectParcel;
  const parcelsGeoJSONRef = useRef(parcelsGeoJSON);
  parcelsGeoJSONRef.current = parcelsGeoJSON;

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
      ? ['case', ['in', ['get', 'parcel_id'], ['literal', spatialIntersectsIds]], 0.55, 0.22]
      : 0.22;

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

      // Selected Parcel Fill (Glowing Semi-Transparent Cyan Highlight)
      map.addLayer({
        id: 'parcels-selected-fill',
        type: 'fill',
        source: 'parcels-source',
        filter: ['==', ['get', 'parcel_id'], ''],
        paint: {
          'fill-color': '#06B6D4',
          'fill-opacity': 0.45
        }
      });

      // Selected Parcel Outline (Crisp Cyan Line)
      map.addLayer({
        id: 'parcels-selected',
        type: 'line',
        source: 'parcels-source',
        filter: ['==', ['get', 'parcel_id'], ''],
        paint: {
          'line-color': '#00E5FF',
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

      // Universal Parcel Click Handler
      const handleParcelClick = (e: any) => {
        let feature = e.features && e.features[0];
        if (!feature) {
          const rendered = map.queryRenderedFeatures(e.point, {
            layers: ['parcels-fill', 'parcels-labels', 'parcels-line']
          });
          if (rendered && rendered.length > 0) {
            feature = rendered[0];
          }
        }
        if (!feature) return;

        const props = (feature.properties || {}) as any;
        const parcelId = props.parcel_id;
        
        let geom = feature.geometry as Polygon;
        const fullFeature = parcelsGeoJSONRef.current?.features.find((f: any) => f.properties?.parcel_id === parcelId);
        if (fullFeature?.geometry) {
          geom = fullFeature.geometry as Polygon;
        }

        onSelectParcelRef.current({
          parcel_id: props.parcel_id || fullFeature?.properties?.parcel_id || 'P0001',
          ulpin: props.ulpin || fullFeature?.properties?.ulpin || 'ULPIN-DEMO-000001',
          survey_no: props.survey_no || fullFeature?.properties?.survey_no || '10/1',
          survey_number: props.survey_number || props.survey_no || fullFeature?.properties?.survey_number || '10/1',
          area_acres: Number(props.area_acres || fullFeature?.properties?.area_acres || 1.0),
          village: props.village || fullFeature?.properties?.village || 'Karjat',
          district: props.district || fullFeature?.properties?.district || 'Raigad',
          state: props.state || fullFeature?.properties?.state || 'Maharashtra',
          zone_id: props.zone_id || fullFeature?.properties?.zone_id || 'Zone-01',
          geometry: geom
        });
      };

      map.on('click', 'parcels-fill', handleParcelClick);
      map.on('click', 'parcels-line', handleParcelClick);
      map.on('click', 'parcels-labels', handleParcelClick);
      map.on('click', handleParcelClick);

      // Cursor Hover on all parcel elements
      ['parcels-fill', 'parcels-line', 'parcels-labels'].forEach(layerId => {
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
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
      if (map.getLayer('parcels-selected-fill')) {
        map.setFilter('parcels-selected-fill', ['==', ['get', 'parcel_id'], selectedParcel.parcel_id]);
      }
      const bbox = computeBBox(selectedParcel.geometry);
      if (bbox && !isNaN(bbox[0])) {
        map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 90, maxZoom: 18, duration: 1000 });
      }
    } else {
      if (map.getLayer('parcels-selected')) {
        map.setFilter('parcels-selected', ['==', ['get', 'parcel_id'], '']);
      }
      if (map.getLayer('parcels-selected-fill')) {
        map.setFilter('parcels-selected-fill', ['==', ['get', 'parcel_id'], '']);
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
