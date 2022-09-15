import { Injectable } from '@angular/core';
import {
  Feature,
  FeatureCollection,
  NewGroup,
  GroupForm,
} from '../models/models';
import { BehaviorSubject, Observable } from 'rxjs';
import { GeoDataService } from './geo-data.service';
import { FormsService, tags } from './forms.service';
import { feature } from '@turf/turf';
import { AbstractEmitterVisitor } from '@angular/compiler/src/output/abstract_emitter';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class FeatureService {
  private featureCollection: FeatureCollection;
  private _features: BehaviorSubject<FeatureCollection>;
  public features$: Observable<FeatureCollection>;

  constructor(
    private geoDataService: GeoDataService,
    private formsService: FormsService
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

  //Update Styles takes an object defining new style options and the feature they should be connected with
  updateStyle(feature: Feature, style): void {
    //Update and save the list
    this.featureCollection.features.forEach((feat) => {
      if (feat.id == feature.id) {
        feat.styles = style;
      }
    });
    this.geoDataService.updateFeatureStyle(
      feature.project_id,
      Number(feature.id),
      feature.properties
    );
  }

  deleteForm(
    projectId: number,
    form: GroupForm,
    activeGroup: NewGroup,
    featureGroups: Feature[]
  ): void {
    const taggedGroup: NewGroup = {
      ...activeGroup,
      forms: activeGroup.forms.filter((t: GroupForm) => t.id !== form.id),
    };

    this.geoDataService.updateGroupFeatures(
      projectId,
      featureGroups,
      taggedGroup
    );
  }

  renameForm(
    projectId: number,
    targetForm: GroupForm,
    activeGroup: NewGroup,
    featureGroups: Feature[],
    newName: string
  ): void {
    const taggedGroup: NewGroup = {
      ...activeGroup,
      forms: [...activeGroup.forms.filter(form => form.id !== targetForm.id), { ...targetForm, label: newName }],
    };

    this.geoDataService.updateGroupFeatures(
      projectId,
      featureGroups,
      taggedGroup
    );
  }

  createForm(
    projectId: number,
    form: GroupForm,
    activeGroup: NewGroup,
    featureGroups: Feature[]
  ): void {
    const id = uuidv4();
    form = { ...form, id };
    const taggedGroup: NewGroup = {
      ...activeGroup,
      forms: activeGroup.forms ? [...activeGroup.forms, form] : [form],
    };
    this.geoDataService.updateGroupFeatures(
      projectId,
      featureGroups,
      taggedGroup
    );
  }
}
