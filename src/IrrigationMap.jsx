import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const IrrigationMap = () => {
  const position = [28.6139, 77.2090]; // Example: Delhi (change later)

  return (
    <MapContainer
      center={position}
      zoom={13}
      style={{ height: "100%", width: "100%" ,borderRadius:"12px" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      <Marker position={position}>
        <Popup>
          <strong>Zone A</strong><br />
          Soil Moisture: 32%<br />
          Status: Active
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default IrrigationMap;
