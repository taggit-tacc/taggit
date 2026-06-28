import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import 'leaflet.markercluster';

import { GeoDataService } from '../../services/geo-data.service';
import { createMarker } from '../../utils/leafletUtils';
import { Feature } from 'geojson';
import { FeatureGroup, LatLng, LeafletMouseEvent } from 'leaflet';
import * as turf from '@turf/turf';
import { AllGeoJSON } from '@turf/helpers';
import { filter, skip } from 'rxjs/operators';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {
  map: L.Map;
  mapType = 'normal';
  activeFeature: Feature;
  features: FeatureGroup = new FeatureGroup();

  constructor(
    private GeoDataService: GeoDataService,
    private route: ActivatedRoute
  ) {
    // Have to bind these to keep this being this
    this.featureClickHandler.bind(this);
    this.mouseEventHandler.bind(this);
  }

  ngOnInit() {
    // const mapType: string = this.route.snapshot.queryParamMap.get('mapType');
    // this.projectId = +this.route.snapshot.paramMap.get("projectId");
    // this.cluster = this.route.snapshot.queryParamMap.get('mapType');
    this.map = new L.Map('map', {
      center: [40, -80],
      zoom: 9,
    });

    const baseOSM = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );
    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      }
    );
    // default to streetmap view;
    this.map.addLayer(baseOSM);

    this.loadFeatures();

    // Publish the mouse location on the mapMouseLocation stream
    this.map.on('mousemove', (ev: LeafletMouseEvent) =>
      this.mouseEventHandler(ev)
    );

    // Listen on the activeFeature stream and zoom map to that feature when it changes
    this.GeoDataService.activeFeature
      .pipe(filter((n) => n != null))
      .subscribe((next) => {
        this.activeFeature = next;
        const bbox = turf.bbox(<AllGeoJSON> next);
        this.map.fitBounds([
          [bbox[1], bbox[0]],
          [bbox[3], bbox[2]],
        ]);
      });

    // Listen for changes to the basemap
    this.GeoDataService.basemap.pipe(skip(1)).subscribe((next) => {
      if (next == 'sat') {
        this.map.removeLayer(baseOSM);
        this.map.addLayer(satellite);
      }
      if (next == 'roads') {
        this.map.removeLayer(satellite);
        this.map.addLayer(baseOSM);
      }
    });
  }

  mouseEventHandler(ev: any): void {
    this.GeoDataService.mapMouseLocation = ev.latlng;
  }

  /**
   * Load Features for a project.
   */
  loadFeatures() {
    const geojsonOptions = {
      pointToLayer: createMarker,
    };
    this.GeoDataService.features.subscribe((collection) => {
      this.features.clearLayers();
      const markers = L.markerClusterGroup({
        iconCreateFunction: (cluster) => {
          return L.divIcon({
            html: `<div><b>${cluster.getChildCount()}</b></div>`,
            className: 'marker-cluster',
          });
        },
      });
      collection.features.forEach((d) => {
        const feat = L.geoJSON(d, geojsonOptions);
        feat.on('click', (ev) => {
          this.featureClickHandler(ev);
        });

        if (d.geometry.type == 'Point') {
          markers.addLayer(feat);
        } else {
          this.features.addLayer(feat);
        }
      });
      this.features.addLayer(markers);
      this.map.addLayer(this.features);
      try {
        this.map.fitBounds(this.features.getBounds());
      } catch (e) {}
    });
  }

  /**
   *
   * @param ev
   */
  featureClickHandler(ev: any): void {
    const f = ev.layer.feature;
    this.GeoDataService.activeFeature = f;
  }
}
