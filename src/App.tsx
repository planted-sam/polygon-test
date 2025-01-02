import { useState } from "react";
import "./App.css";
import { readFileFromUser } from "./fileUpload.ts";
import { kmlOrKmzToPolygons } from "./kml.ts";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";

const polygonOptions = { color: "purple" };

function App() {
  const [file, setFile] = useState<null | { name: string; data: ArrayBuffer }>(
    null
  );

  const [polygons, setPolygons] = useState<[number, number][][]>([]);

  const onUploadClick = async () => {
    const newFile = (await readFileFromUser(".kml,.kmz")) as {
      name: string;
      data: ArrayBuffer;
    };
    setFile(newFile);
    const { polygons: newPolygons } = await kmlOrKmzToPolygons(
      newFile.name,
      newFile.data
    );
    const parsedPolygons = newPolygons.map((polygon) =>
      polygon.points.map((point) => [point[1], point[0]])
    ) as [number, number][][];
    setPolygons(parsedPolygons);
  };

  return (
    <>
      <div className="card">
        <p>Upload KML to parse the polygons within</p>
        <button onClick={onUploadClick}>Upload here</button>
      </div>
      <div className="card">
        <p>{file !== null ? file.name : "no file uploaded"}</p>
      </div>
      {/** Note that leaflet expects coords in lat/lon order */}
      <MapContainer
        className="map"
        center={[32.5939129980001, -92.44634703]}
        zoom={20}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline pathOptions={polygonOptions} positions={polygons} />
      </MapContainer>
    </>
  );
}

export default App;
