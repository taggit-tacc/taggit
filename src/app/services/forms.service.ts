import { Component, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { Group, NewGroup, GroupForm, Tag, Project } from '../models/models';
import { map, first } from 'rxjs/operators';
import { GroupsService } from './groups.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ProjectsService } from './projects.service';
import { GeoDataService } from './geo-data.service';
import { prepareSyntheticListenerFunctionName } from '@angular/compiler/src/render3/util';
import { fadeInItems } from '@angular/material';
import { Feature, FeatureCollection } from 'geojson';

@Injectable({
  providedIn: 'root',
})
export class FormsService {
  private _forms: BehaviorSubject<Group[]> = new BehaviorSubject([]);
  public forms: Observable<Group[]> = this._forms.asObservable();

  private _activeFormList: BehaviorSubject<any[]> = new BehaviorSubject([]);
  public activeFormList: Observable<any[]> =
    this._activeFormList.asObservable();

  private _formGroup: BehaviorSubject<FormGroup> =
    new BehaviorSubject<FormGroup>(null);
  public formGroup: Observable<FormGroup> = this._formGroup.asObservable();

  private activeGroup;
  private groups: Map<string, NewGroup>;
  private groupsFeatures: Map<string, any>;
  private featureList: Array<any> = [];
  features: FeatureCollection;
  private selectedProject;
  private selectedFeatureID;
  private selectedFeature;

  constructor(
    private groupsService: GroupsService,
    private projectsService: ProjectsService,
    private geoDataService: GeoDataService
  ) {
    this.geoDataService.activeGroup.subscribe((next) => {
      this.activeGroup = next;
    });

    this.geoDataService.groups.subscribe((next) => {
      this.groups = next;
    });

    this.geoDataService.groupsFeatures.subscribe((next) => {
      this.groupsFeatures = next;
    });

    this.projectsService.activeProject.subscribe((next) => {
      this.selectedProject = next;
    });

    this.geoDataService.activeFeature.subscribe((next) => {
      this.selectedFeature = next;
    });
    this.geoDataService.features.subscribe((fc: FeatureCollection) => {
      this.features = fc;

      if (this.features != undefined) {
        this.featureList = this.features.features;
      }
    });
  }

  checkDefault(selectedColor: string) {
    if (selectedColor === 'default') {
      try {
        selectedColor = this.selectedFeature.styles.color;
      } catch (error) {
        selectedColor = '#00C8FF';
      }
    }
    return selectedColor;
  }

  //Inputs:
  //color:string A 7 digit hexadecimal string (#RRGGBB) passed in from a color tag
  //This method accesses group services to retrive the current group's icon as well
  // REDO: because it doesn't utilize hazmapper's styles properly
  saveStyles(
    projectId: number,
    selectedColor: string,
    groupName: string,
    feature: Feature
  ) {
    const group = this.groups.get(groupName);
    group.color = this.checkDefault(selectedColor);

    const style = {
      faIcon: group.icon,
      color: group.color,
    };

    this.geoDataService.updateGroupFeatures(projectId, [feature], group);
    this.geoDataService.updateFeatureStyle(projectId, feature.id, style);
  }

  addGroup(groupName: string) {
    let groupObject = new Group();
    groupObject.formList = [];

    groupObject.groupName = groupName;

    this.forms.pipe(first()).subscribe((current) => {
      current.push(groupObject);
      this._forms.next(current);
    });
  }

  userTag: tags = {
    type: 'text',
    groupName: 'car',
    label: 'Title',
    options: [],
    feature: '',
    extra: [],
  };
  tagData = [];
  checkedOptions = [];
  chosenTag = [{ option: '', id: 0 }, '', '']; //chosen option of both Radio Buttons and Color tags. Radio info is stored at [0], Color at [1]
  notebook = []; //Var for storing note tags

  optData = [];
  deleteOpt(gName: string, opt: object, tag: tags): void {
    const index = this.optData.findIndex(
      (item) => item.groupName === gName && item.label === tag.label
    );
    if (index > -1) {
      const ind = this.optData[index].options.findIndex((item) => item === opt);
      if (ind > -1) {
        this.optData[index].options.splice(ind, 1);
      }
    }
  }

  updateTagValue(
    activeProject: Project,
    feature: Feature,
    form: GroupForm,
    tagValue: any
  ) {
    let tagProp = feature.properties.tags ? feature.properties.tags : [];
    tagProp = tagProp.filter((tag: Tag) => form.id !== tag.id);

    const tag = {
      id: form.id,
      value: tagValue,
    };

    feature.properties.tags = [...tagProp, tag];

    this.geoDataService.updateFeatureProperty(
      activeProject.id,
      feature.id,
      feature.properties
    );
  }

  updateTagValues(
    activeProject: Project,
    feature: Feature,
    formList: GroupForm[],
    newValues: any[]
  ) {
    feature.properties.tags = newValues;
    this.geoDataService.updateFeatureProperty(
      activeProject.id,
      feature.id,
      feature.properties
    );
  }

  getTagValue(feature: Feature, form: GroupForm): any {
    if (feature.properties.tags) {
      const tagValueObj = feature.properties.tags.find(
        (featTag: any) => featTag.id && featTag.id === form.id
      );

      if (tagValueObj) {
        return tagValueObj.value;
      }
    }
    if (form.type === 'checkbox') {
      return [];
    } else {
      return '';
    }
  }
}

// TODO: put this in models so we can reference it like we do the Features type
export interface tags {
  type: string;
  groupName: string;
  label: string;
  options: Array<Group>;
  feature: string | number;
  extra: Array<Group>;
  id?: string;
}
