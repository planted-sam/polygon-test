import { kml } from '@tmcw/togeojson';
import type { Geometries, LineString } from '@turf/turf';
import { isEqual } from 'es-toolkit';
import JSZip from 'jszip';
import { geodeticToEnu } from './enuConversion';

// Allow points to snap 1mm to close polygons
const POINT_SNAPPING_THRESHOLD_METERS = 0.001;

// Creates an array of GeoFeature polygons given a KML data and a polygon type
// points in returned polygons are in [lon, lat] order
export const kmlOrKmzToPolygons = async (
  filename: string,
  kmlData: ArrayBuffer
) => {
  let kmlString: string;
  if (isKmz(filename)) {
    kmlString = await extractKmlFromKmz(kmlData);
  } else {
    kmlString = new TextDecoder('utf-8').decode(kmlData);
  }
  return kmlStringToPolygons(kmlString);
};

export const kmlStringToPolygons = (kmlString: string) => {
  kmlString = kmlString.trim();
  const domParser = new DOMParser();
  const document = domParser.parseFromString(kmlString, 'text/xml');
  const geoJson = kml(document);
  const errors: string[] = [];
  const geoJsonPolygons = extractPolygonsFromGeoJson(geoJson, errors);
  const polygons: { points: [number, number][] }[] = [];
  for (const coords of geoJsonPolygons) {
    if (coords !== undefined && coords.length > 0) {
      const polygon = { points: coords };
      polygons.push(polygon);
    }
  }
  return { polygons, errors };
};

const extractPolygonsFromGeoJson = (
  geoJson: any,
  errors: string[]
): [number, number][][] => {
  const type = geoJson.type;
  if (type === 'FeatureCollection') {
    return extractPolygonsFromGeoJsonCollection(geoJson.features, errors);
  }
  if (type === 'GeometryCollection') {
    return extractPolygonsFromGeoJsonCollection(geoJson.geometries, errors);
  }
  if (type === 'Polygon') {
    return coordsToPolygons(geoJson.coordinates[0], errors);
  }
  if (type === 'LineString') {
    return coordsToPolygons(geoJson.coordinates, errors);
  }
  if (type === 'Feature') {
    return extractPolygonsFromGeoJson(geoJson.geometry, errors);
  }
  errors.push(`Unknown feature type: ${type}`);
  return [];
};

const extractPolygonsFromGeoJsonCollection = (
  collection: Array<Geometries>,
  errors: string[]
) => {
  const isPolygonComprisedOfTwoCoordLineStrings =
    collection.length >= 3 &&
    collection.every(
      (feature: Geometries) =>
        feature.type === 'LineString' && feature.coordinates.length === 2
    );
  if (isPolygonComprisedOfTwoCoordLineStrings) {
    return extractPolygonsFromTwoCoordLineStrings(
      collection as LineString[],
      errors
    );
  }
  let polygons: [number, number][][] = [];
  for (const feature of collection) {
    polygons = polygons.concat(extractPolygonsFromGeoJson(feature, errors));
  }
  return polygons;
};

const extractPolygonsFromTwoCoordLineStrings = (
  twoCoordLineStrings: LineString[],
  errors: string[]
) => {
  const coords = [twoCoordLineStrings[0].coordinates[0]];
  for (const feature of twoCoordLineStrings) {
    const [coord1, coord2] = feature.coordinates;
    const areCoordsCloseEnough = getAreCoordsCloseEnough(
      coord1,
      coords[coords.length - 1]
    );
    if (!areCoordsCloseEnough) {
      errors.push(
        'Could not create polygon from set of two-coordinate LineStrings. ' +
          "One coordinate pair's first coord did not match the previous coordinate's second coord."
      );
      return [];
    }
    coords.push(coord2);
  }
  return coordsToPolygons(coords, errors);
};

const coordsToPolygons = (
  rawCoords: number[][],
  errors: string[]
): [number, number][][] => {
  const coords: [number, number][] = rawCoords.map((point) => [
    point[0],
    point[1],
  ]);
  if (coords.length <= 3) {
    errors.push(
      'Could not create a polygon because it had fewer than four ' +
        'coordinates (last coordinate  must be first coordinate repeated)'
    );
    return [];
  }
  if (!isEqual(coords[0], coords[coords.length - 1])) {
    const areCoordsCloseEnough = getAreCoordsCloseEnough(
      coords[0],
      coords[coords.length - 1]
    );
    if (areCoordsCloseEnough) {
      coords[0] = coords[coords.length - 1];
    } else {
      errors.push(
        "Could not create a polygon because it's last coordinate was not equal " +
          'to its first coordinate (last coordinate must be first coordinate repeated).'
      );
      return [];
    }
  }
  return [coords];
};

const getAreCoordsCloseEnough = (
  coord1: number[],
  coord2: number[]
): boolean => {
  const [dX, dY] = geodeticToEnu(
    coord1[0],
    coord1[1],
    0,
    coord2[0],
    coord2[1],
    0
  );
  const distanceMeters = Math.sqrt(dX ** 2 + dY ** 2);
  return distanceMeters < POINT_SNAPPING_THRESHOLD_METERS;
};

const isKmz = (filename: string): boolean => {
  return filename.slice(-4).toLowerCase() === '.kmz';
};

const extractKmlFromKmz = async (kmzData: ArrayBuffer) => {
  const zip = await JSZip.loadAsync(kmzData);
  const kmlFile = zip.file(/\.kml$/i)[0];
  if (!kmlFile) {
    alert('Error. Could not find KML file in given KMZ.');
  }
  const kmlString = await kmlFile.async('string');
  return kmlString;
};
