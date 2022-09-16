import { Injectable } from '@angular/core';
import {
  Feature,
  FeatureCollection
} from '../models/models';
import { BehaviorSubject, Observable } from 'rxjs';
import { GeoDataService } from './geo-data.service';
import { feature } from '@turf/turf';

@Injectable({
  providedIn: 'root',
})
export class FeatureService {
  private featureCollection: FeatureCollection;
  private _features: BehaviorSubject<FeatureCollection>;
  public features$: Observable<FeatureCollection>;

  constructor(
    private geoDataService: GeoDataService,
  ) {
    this._features = new BehaviorSubject<FeatureCollection>({
      type: 'FeatureCollection',
      features: [],
    });
    this.features$ = this._features.asObservable();

    this.geoDataService.features.subscribe((fc: FeatureCollection) => {
      this._features.next(fc);
      this.featureCollection = fc;
    });
  }

  //Takes the feature to be deleted, and filters it out of the feature list
  deleteFeature(feat: Feature): void {
    this.featureCollection.features = this.featureCollection.features.filter(
      (featListfeat) => featListfeat.id != feat.id
    );
    this._features.next(this.featureCollection); //Update the observable
    this.geoDataService.deleteFeature(feat);
  }

  //Takes a list of features, and deletes them from the observable in a more efficient manner
  bulkFeatureDelete(delFeats: Array<Feature>): void {
    delFeats.forEach((feat) => {
      //Filter out every feature in delFeats from the master list
      this.featureCollection.features = this.featureCollection.features.filter(
        (featListFeature) => featListFeature.id != feat.id
      );
      this.geoDataService.deleteFeature(feat);
    });
    this._features.next(this.featureCollection); //Update the observable with the filtered list
  }

  saveFeature(feat: Feature): void {
    this.geoDataService.updateFeatureProperty(
      feat.project_id,
      Number(feat.id),
      feat.properties
    );
  }

  //Takes a feature, and optionally an updated property section
  //If featprop is null, it assumes the passed in feature was already updated with the new properties
  updateFeatureProperties(feature: Feature, featProp = null): void {
    //If featprop has a value, update the feature's properties to the new section
    if (featProp != null) {
      feature.properties = featProp;
    }
    //Update and save the list
    this.featureCollection.features.forEach((feat) => {
      if (feat.id == feature.id) {
        feat = feature;
      }
    });
    this.saveFeature(feature);
  }
}
