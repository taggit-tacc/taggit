import { Component, OnInit, OnDestroy, TemplateRef } from '@angular/core';
import { GroupsService } from '../../../services/groups.service';
import { FormsService, tags } from '../../../services/forms.service';
import { MatDialog } from '@angular/material/dialog';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { GeoDataService } from 'src/app/services/geo-data.service';
import { Feature, FeatureCollection } from 'geojson';
import { ProjectsService } from 'src/app/services/projects.service';
import { FeatureService } from 'src/app/services/feature.service';
import { NewGroup, GroupForm } from 'src/app/models/models';

@Component({
  selector: 'app-tag-images',
  templateUrl: './tag-images.component.html',
  styleUrls: ['./tag-images.component.scss'],
})
export class TagImagesComponent implements OnInit {
  activeGroup: NewGroup;
  payload: any;
  selectedGroup: string;
  openOption: any = {};
  private activeProject;
  showSubitem: boolean = true;
  formList: GroupForm[] = [];
  newTag: tags[] = [];
  newTagValue = '';
  featureList: Array<any> = [];
  groups: Map<string, NewGroup>;
  groupsFeatures: Map<string, Feature[]>;
  activeGroupFeatures: any;
  tempGroup: Array<Feature>;
  activeGroupFeature: Feature;
  tagValues = [];

  constructor(
    private groupsService: GroupsService,
    private formsService: FormsService,
    private dialog: MatDialog,
    private router: Router,
    private projectsService: ProjectsService,
    private geoDataService: GeoDataService,
    private featureService: FeatureService
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
        if (grpFts) {
          this.activeGroupFeatures = grpFts.get(grp.name);
        }
      }
    });

    this.geoDataService.activeGroupFeature.subscribe((next) => {
      this.activeGroupFeature = next;
    });

    this.projectsService.activeProject.subscribe((next) => {
      this.activeProject = next;
    });

    this.featureService.features$.subscribe((fc: FeatureCollection) => {
      this.featureList = fc.features;
    });

    // this is to get the list of tags so far
    for (let feat of this.featureList) {
      if (feat.properties.tag != undefined) {
        feat.properties.tag.forEach((tag) => {
          const index = this.newTag.findIndex(
            (item) =>
              item.groupName === tag.groupName &&
              item.label === tag.label &&
              item.feature === tag.feature
          );
          if (index == -1) {
            this.newTag.push(tag);
          }
        });
      }
    }
  }

  openRenameModal(template: TemplateRef<any>, name: string) {
    this.selectedGroup = name;
    this.dialog.open(template);
  }

  openRenameOptionModal(template: TemplateRef<any>) {
    this.dialog.open(template);
  }

  //Takes the name of the tag's group, and the tag itself to delete
  deleteForm(tag: GroupForm) {
    this.featureService.deleteForm(
      this.activeProject.id,
      tag,
      this.groups.get(this.activeGroup.name),
      this.groupsFeatures.get(this.activeGroup.name)
    );
  }

  //submits a tag's name change to geoAPI
  renameForm(tag: GroupForm) {
    this.featureService.renameForm(
      this.activeProject.id,
      tag,
      this.groups.get(this.activeGroup.name),
      this.groupsFeatures.get(this.activeGroup.name),
      this.newTagValue
    );
    //Reset newTagValue for the next rename
    this.newTagValue = '';
    this.dialog.closeAll(); //Ensures the window closes when using enter-submission
  }

  openOptionToggle(label: string) {
    if (this.openOption[label]) {
      this.openOption[label] = false;
    } else {
      this.openOption[label] = true;
    }
  }

  createNewForm() {
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
