import {CircleMarker, circleMarker, divIcon, LatLng, Marker, marker} from "leaflet";
import {Feature} from "../models/models";

function createCircleMarker (feature: Feature, latlng: LatLng): CircleMarker {
  let options = {
    radius: 8,
    fillColor: "#d3d3d3",
    color: "black",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  };
  return circleMarker( latlng, options );
}

function createImageMarker (feature: Feature, latlng: LatLng): Marker {
  let divHtml = "<i class='fas fa-camera-retro fa-2x light-blue'></i>";
  let ico = divIcon({className: 'leaflet-fa-marker-icon', html: divHtml});
  return marker(latlng, {icon: ico});
}

function createCollectionMarker (feature: Feature, latlng: LatLng) : Marker {
  let divHtml = '<i class="fa fa-folder-open fa-2x light-blue"></i>';
  let ico = divIcon({className: 'icon-marker', html: divHtml});
  return marker(latlng, {icon: ico});
}
function createVideoMarker (feature: Feature, latlng: LatLng): Marker {
  let divHtml = "<i class='fas fa-video fa-2x light-blue'></i>";
  let ico = divIcon({className: 'leaflet-fa-marker-icon', html: divHtml});
  return marker(latlng, {icon: ico});
}

export function createMarker(feature: Feature, latlng: LatLng) : Marker {
  let marker;
  if (feature.featureType() == 'image') {
    marker = createImageMarker(feature, latlng);
  } else if (feature.featureType() == 'collection'){
    marker =  createCollectionMarker(feature, latlng);
  } else if (feature.featureType() == 'video') {
    marker = createVideoMarker(feature, latlng)
  }
  else {
    marker = createCircleMarker(feature, latlng)
  }
  return marker;

}
