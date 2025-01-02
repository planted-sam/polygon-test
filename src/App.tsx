import { useState } from "react";
import "./App.css";
import { readFileFromUser } from "./fileUpload.ts";
import { kmlOrKmzToPolygons } from "./kml.ts";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";

const polygonOptions = { color: "purple" };

function App() {
  const [file, setFile] = useState<null | { name: string; data: ArrayBuffer }>(
    null,
  );

  const [polygons, setPolygons] = useState<[number, number][][]>([]);

  const onUploadClick = async () => {
    const newFile = (await readFileFromUser(".kml,.kmz")) as {
      name: string;
      data: ArrayBuffer;
    };
    setFile(newFile);
    const { polygons: newPolygons, _errors } = await kmlOrKmzToPolygons(
      newFile.name,
      newFile.data,
    );
    const parsedPolygons = newPolygons.map((polygon) =>
      polygon.points.map((point) => [point[1], point[0]]),
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

      <MapContainer
        className="map"
        center={[32.5939129980001, -92.44634703]}
        zoom={20}
      >
        <TileLayer
          attribution="MapTiler"
          url="https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=8hSCSEUoL6Ko5Bmh1N68"
        />
        <Polyline pathOptions={polygonOptions} positions={polygons} />
      </MapContainer>
    </>
  );
}

export default App;
