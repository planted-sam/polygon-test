import { useState } from "react";
import "./App.css";
// import { readFileFromUser } from "./fileUpload.ts";
// import { kmlOrKmzToPolygons } from "./kml.ts";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";

const polygonOptions = { color: "purple" };

// example rectangle polygon near initial map center
const placeholderPolygons: [number, number][][] = [
  [
    [32.5939129980001, -92.44634703],
    [32.5939129980001, -92.43634703],
    [32.5839129980001, -92.43634703],
    [32.5839129980001, -92.44634703],
    [32.5939129980001, -92.44634703],
  ],
];

function App() {
  const [file, setFile] = useState<null | { name: string; data: ArrayBuffer }>(
    null
  );

  const [polygons, setPolygons] =
    useState<[number, number][][]>(placeholderPolygons);

  // TODO: Finish function to make it get a file from the user and parse it
  // (See comment stubs)
  const onUploadClick = async () => {
    // read file from user using `readFileFromUser`
    // ideally only getting kml or kmz files

    // set file data to state so filename can be displayed to user

    // parse polygons from file using `kmlOrKmzToPolygons`

    // prepare polygons to be displayed in leaflet map
    const parsedPolygons = placeholderPolygons; //TODO: replace
    // set polygons array to state var so map picks it up and displays it
    setPolygons(parsedPolygons);
  };

  return (
    <>
      <div className="card">
        <p>Upload KML to parse the polygons within</p>
        <button onClick={onUploadClick}>Upload here</button>
      </div>
      <div className="card">
        <p>no file uploaded</p>
      </div>
      <MapContainer
        className="map"
        center={[32.5939129980001, -92.44634703]}
        zoom={20}
      >
        {/** Basic map layer so we can see where things are */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/** Polygon layer: Note that leaflet expects coords in lat/lon order */}
        <Polyline pathOptions={polygonOptions} positions={polygons} />
      </MapContainer>
    </>
  );
}

export default App;
