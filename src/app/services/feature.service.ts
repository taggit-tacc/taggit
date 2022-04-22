import { Injectable } from '@angular/core';
import { Feature, FeatureCollection} from '../models/models';
import { BehaviorSubject, Observable } from 'rxjs';
import { GeoDataService } from './geo-data.service';

@Injectable({
  providedIn: 'root'
})
export class FeatureService {
  private features: FeatureCollection;
  private _features: BehaviorSubject<FeatureCollection>;
  private features$: Observable<FeatureCollection>;
  private _tags: BehaviorSubject<Array<Object>>;
  private tags$: Observable<Array<Object>>;
  private tagList: Array<Object> = [];

  constructor(private geoDataService: GeoDataService) {
    this._features = new BehaviorSubject<FeatureCollection>({type: 'FeatureCollection', features: []});
    this.features$ = this._features.asObservable();

    this._tags = new BehaviorSubject<Array<Object>>( [] );
    this.tags$ = this._tags.asObservable();

    this.geoDataService.features.subscribe( (fc: FeatureCollection) => {
      this._features.next(fc)
      this.features = fc
      console.log(this.features)

      //Update the tag list alongside the features
      try {
        if( this.tagList == [] ) { //Only update if tagList is empty, after retrieval, the only way to edit tags will be to edit this list
            this.tagList = this.features.features[0].properties.tag
            this._tags.next( this.tagList )
        }
      } catch (error) {}
      });
  }

  //This has to manage all features, tags, and maybe groups as well. While I think that groups service has all the methodology,
  //the input for all that is features done by the local lists 

  //Getter method, returns the feature collection
  getFeatureCollection(): FeatureCollection {
    return this.features
  }

  //Takes the ID of the feature to be deleted, and filters it out of the feature list
  deleteFeature(featID:Number): void {
    this.features.features = this.features.features.filter(feat => feat.id == featID)
    this._features.next(this.features)  //Update the observable
    this.saveFeatures(this.features) //Save features to backend
  }

  //saveFeatures takes a feature list and passes it to GeoAPI to save
  //With this scheme, you can just update a feature's property
  saveFeatures(features:FeatureCollection): void {
    this._features.next(features)  //Update the observable
    features.features.forEach(feat => {
      this.geoDataService.updateFeatureProperty(feat.project_id, Number(feat.id), feat.properties)
    })
  }

  //This might be a little short to consider a function, but it saves me from writing it every time...
  //Assumes that the feature passed in has had it's properties updated or changed before being passed in
  saveFeature(feat:Feature): void {
    this.geoDataService.updateFeatureProperty(feat.project_id, Number(feat.id), feat.properties)
  }

  //Takes a feature, and optionally an updated property section
  //If featprop is null, 
  updateFeatureProperties(feature:Feature, featProp=null): void {
    //If featprop has a value, update the feature's properties to the new section
    if( featProp != null) {
      feature.properties = featProp
    }
    //Update and save the list
    this.features.features.forEach(feat => {
      if(feat.id == feature.id){
        feat = feature
      }
    })
    this.saveFeature(feature)
  }
  
  //Update Styles takes an object defining new style options and the feature they should be connected with
  updateStyle(feature:Feature, style): void {
    //Update and save the list
    this.features.features.forEach(feat => {
      if(feat.id == feature.id){
        feat.styles = style
      }
    })
    this.geoDataService.updateFeatureStyle(feature.project_id, Number(feature.id), feature.properties)
  }

  //Save tags has 2 purposes, first it updates every feature's tag list to reflect the change, then it sends the features to GeoAPI to be saved
  saveTags(tagList): void {
    this._tags.next(this.tagList) //Update the observable
    //Update each feature's tag list
    this.features.features.forEach(feat => {
      feat.properties.tag = tagList
    });
    this.saveFeatures(this.features) //Save updated features to backend
  }

  //Takes the entire tag that should be deleted and filters the list from it
  deleteTag(tag): void {
    this.tagList = this.tagList.filter(listTag => listTag == tag)
    this._tags.next(this.tagList) //Update the observable
    this.saveTags(this.tagList) //saves tags to backend
  }
}