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

  // Custom marker icon (colored circle)
  const createCircleIcon = (color: string) =>
    L.divIcon({
      className: "custom-reservoir-marker",
      html: `<div style=\"background:${color};width:24px;height:24px;border-radius:50%;border:2px solid #333;\"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

  return (
    <MapContainer
      center={[22.5, 72.5] as LatLngExpression}
      zoom={7}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", borderRadius: 8 }}
      attributionControl={false}
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
            color: "#333",
            weight: 1.5,
            fillOpacity: 1,
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
  );
};

export default ReservoirMap; 