import { Component, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { Group, TagGroup, GroupForm, Tag, Project } from '../models/models';
import { map, first } from 'rxjs/operators';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GeoDataService } from './geo-data.service';
import { prepareSyntheticListenerFunctionName } from '@angular/compiler/src/render3/util';
import { fadeInItems } from '@angular/material';
import { Feature, FeatureCollection } from 'geojson';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class FormsService {
  constructor(private geoDataService: GeoDataService) {}

  deleteForm(
    projectId: number,
    form: GroupForm,
    activeGroup: TagGroup,
    featureGroups: Feature[]
  ): void {
    const taggedGroup: TagGroup = {
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
    activeGroup: TagGroup,
    featureGroups: Feature[],
    newName: string
  ): void {
    const taggedGroup: TagGroup = {
      ...activeGroup,
      forms: [
        ...activeGroup.forms.filter((form) => form.id !== targetForm.id),
        { ...targetForm, label: newName },
      ],
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
    activeGroup: TagGroup,
    featureGroups: Feature[]
  ): void {
    const id = uuidv4();
    form = { ...form, id };
    const taggedGroup: TagGroup = {
      ...activeGroup,
      forms: activeGroup.forms ? [...activeGroup.forms, form] : [form],
    };
    this.geoDataService.updateGroupFeatures(
      projectId,
      featureGroups,
      taggedGroup
    );
  }

  checkDefault(selectedColor: string, feature: any) {
    if (selectedColor === 'default') {
      try {
        selectedColor = feature.styles.color;
      } catch (error) {
        selectedColor = '#00C8FF';
      }
    }
    return selectedColor;
  }

  // Inputs:
  // color:string A 7 digit hexadecimal string (#RRGGBB) passed in from a color tag
  // This method accesses group services to retrive the current group's icon as well
  saveStyles(
    projectId: number,
    selectedColor: string,
    group: TagGroup,
    feature: Feature
  ) {
    group.color = this.checkDefault(selectedColor, feature);

    const style = {
      faIcon: group.icon,
      color: group.color,
    };

    this.geoDataService.updateGroupFeatures(projectId, [feature], group);
    this.geoDataService.updateFeatureStyle(projectId, feature.id, style);
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
