import { Component, OnInit, TemplateRef } from '@angular/core';
import { GroupsService } from '../../../services/groups.service';
import { FormsService, tags } from '../../../services/forms.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { GeoDataService } from 'src/app/services/geo-data.service';
import { Feature } from 'geojson';
import { ProjectsService } from 'src/app/services/projects.service';
import { FeatureService } from 'src/app/services/feature.service';
import { TagGroup, GroupForm } from 'src/app/models/models';

@Component({
  selector: 'app-tag-images',
  templateUrl: './tag-images.component.html',
  styleUrls: ['./tag-images.component.scss'],
})
export class TagImagesComponent implements OnInit {
  private activeProject;
  payload: any;
  selectedGroup: string;
  activeGroup: TagGroup;
  showSubitem = true;
  formList: GroupForm[] = [];
  tagName = '';
  groups: Map<string, TagGroup>;
  groupsFeatures: Map<string, Feature[]>;
  activeGroupFeature: Feature;
  tagValues = [];

  constructor(
    private groupsService: GroupsService,
    private formsService: FormsService,
    private dialog: MatDialog,
    private projectsService: ProjectsService,
    private geoDataService: GeoDataService,
  ) {}

  ngOnInit() {
    combineLatest(
      this.geoDataService.activeGroup,
      this.geoDataService.groupsFeatures,
      this.geoDataService.groups
    ).subscribe(([grp, grpFts, grps]) => {
      this.activeGroup = grp;
      this.groupsFeatures = grpFts;
      this.groups = grps;
      if (grp) {
        this.formList = grp.forms;
      }
    });

    this.geoDataService.activeGroupFeature.subscribe((next) => {
      this.activeGroupFeature = next;
    });

    this.projectsService.activeProject.subscribe((next) => {
      this.activeProject = next;
    });
  }

  openRenameModal(template: TemplateRef<any>, name: string) {
    this.selectedGroup = name;
    this.dialog.open(template);
  }

  // Takes the name of the tag's group, and the tag itself to delete
  deleteForm(tag: GroupForm) {
    this.formsService.deleteForm(
      this.activeProject.id,
      tag,
      this.groups.get(this.activeGroup.name),
      this.groupsFeatures.get(this.activeGroup.name)
    );
  }

  // submits a tag's name change to geoAPI
  renameForm(tag: GroupForm) {
    this.formsService.renameForm(
      this.activeProject.id,
      tag,
      this.groups.get(this.activeGroup.name),
      this.groupsFeatures.get(this.activeGroup.name),
      this.tagName
    );
    // Reset newTagValue for the next rename
    this.tagName = '';
    this.dialog.closeAll(); // Ensures the window closes when using enter-submission
  }

  showTagGenerator() {
    this.groupsService.setShowTagGenerator(true);
  }

  saveTags() {
    this.formsService.updateTagValues(
      this.activeProject,
      this.activeGroupFeature,
      this.formList,
      this.tagValues
    );
  }

  setValue(formValue) {
    this.tagValues = this.tagValues.filter((value) => value.id !== formValue.id);
    this.tagValues.push(formValue);
  }

  expandPanel() {
    this.showSubitem = !this.showSubitem;
  }
}
