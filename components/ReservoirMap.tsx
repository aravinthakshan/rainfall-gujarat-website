import React from "react";

const ReservoirMap: React.FC<any> = (props) => {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Map reservoir name to data
  const dataMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    for (const row of props.reservoirData) {
      if (row["Name of Schemes"]) {
        map[row["Name of Schemes"].toLowerCase()] = row;
      }
    }
    return map;
  }, [props.reservoirData]);

  // Get value for selected metric
  const getReservoirValue = (name: string) => {
    const row = dataMap[name.toLowerCase()];
    if (!row) return null;
    const val = row[props.selectedMetric];
    if (val === undefined || val === null || val === "") return null;
    return Number(val);
  };

  if (!isClient) return null;

  const L = require("leaflet");
  const { MapContainer, TileLayer, Marker, Popup, GeoJSON } = require("react-leaflet");
  type LatLngExpression = [number, number];

  // Custom marker icon (smaller circle)
  const createCircleIcon = (color: string) =>
    L.divIcon({
      className: "custom-reservoir-marker",
      html: `<div style="background:${color};width:19px;height:19px;border-radius:50%;border:2px solid #333;"></div>`,
      iconSize: [19, 19],
      iconAnchor: [10, 10],
    });

  // Find bounds of geojson to fit map to Gujarat
  const mapRef = React.useRef<any>(null);
  React.useEffect(() => {
    if (mapRef.current && props.geojson && props.geojson.features.length > 0) {
      const L = require("leaflet");
      const geojsonLayer = L.geoJSON(props.geojson);
      mapRef.current.fitBounds(geojsonLayer.getBounds(), { padding: [20, 20] });
    }
  }, [props.geojson]);

  const [zoom, setZoom] = React.useState(7);

  const handleZoom = (delta: number) => {
    setZoom(z => Math.max(0, z + delta));
    if (mapRef.current) {
      mapRef.current.setZoom(zoom + delta);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        ref={mapRef}
        center={[22.5, 72.5] as LatLngExpression}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", borderRadius: 8 }}
        attributionControl={false}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {/* Render Gujarat boundary as solid white overlay */}
        {props.boundaryGeojson && (
          <GeoJSON
            data={props.boundaryGeojson}
            style={() => ({
              fillColor: "#fff",
              color: "#000",
              weight: 1.5,
              fillOpacity: 0,
            })}
          />
        )}
        {/* Add a marker at each reservoir point, colored the same as before */}
        {props.geojson.features.map((feature: any, i: number) => {
          if (!feature.geometry || feature.geometry.type !== "Point") return null;
          const name = feature?.properties?.["Name of Sc"];
          if (!name || !feature.geometry.coordinates) return null;
          const coords = feature.geometry.coordinates as [number, number];
          const value = getReservoirValue(name);
          const color = value == null ? "#eee" : props.getColor(value);
          // Create marker and attach tooltip on click, and call onReservoirClick
          return (
            <Marker
              key={name + i}
              position={[coords[1], coords[0]] as LatLngExpression}
              icon={createCircleIcon(color)}
              eventHandlers={{
                click: (e: any) => {
                  const marker = e.target;
                  marker.openTooltip();
                  if (props.onReservoirClick) props.onReservoirClick(name);
                },
                add: (e: any) => {
                  const marker = e.target;
                  marker.bindTooltip(
                    `<strong>${name}</strong><br/>${props.selectedMetric}: ${value ?? "-"}<br/>Date: ${props.selectedDate}`,
                    { direction: 'top', sticky: true, permanent: false }
                  );
                }
              }}
            />
          );
        })}
      </MapContainer>
      {/* Custom zoom controls */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, background: 'rgba(255,255,255,0.8)', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <button onClick={() => handleZoom(0.25)} style={{ display: 'block', width: 32, height: 32, fontSize: 20, border: 'none', background: 'none', cursor: 'pointer' }}>+</button>
        <button onClick={() => handleZoom(-0.25)} style={{ display: 'block', width: 32, height: 32, fontSize: 20, border: 'none', background: 'none', cursor: 'pointer' }}>-</button>
      </div>
    </div>
  );
};

export default ReservoirMap; 