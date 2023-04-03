import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BsModalRef } from 'ngx-foundation/modal/bs-modal-ref.service';
import { FeatureService } from 'src/app/services/feature.service';
import { ScrollService } from 'src/app/services/scroll.service';
import { Feature, Project, TagGroup } from '../../models/models';
import { GeoDataService } from '../../services/geo-data.service';
import { GroupsService } from '../../services/groups.service';
import { EnvService } from '../../services/env.service';
import { ProjectsService } from '../../services/projects.service';

@Component({
  selector: 'app-image-box',
  templateUrl: './image-box.component.html',
  styleUrls: ['./image-box.component.scss'],
})
export class ImageBoxComponent implements OnInit {
  @Input() feature: any;
  featureSource: string;
  featurePath: string;
  status = false; // Controls the whether or not an image box is selected or not
  imageSelected = 'img-unselected'; // Controls the whether or not an image box is selected or not
  hasGroup = false;
  colors: Array<string> = [];
  groups: Map<string, TagGroup>;
  coordinates: Array<any>;
  containingGroupList: Array<any>;
  selectedImages: Array<any>;
  modalRef: BsModalRef;
  groupToAdd: TagGroup;

  public activeProject: Project;

  constructor(
    private geoDataService: GeoDataService,
    private groupsService: GroupsService,
    private projectsService: ProjectsService,
    private envService: EnvService,
    private dialog: MatDialog,
    private scrollService: ScrollService,
    private featureService: FeatureService
  ) {}

  ngOnInit() {
    // TODO: put this in models
    let featureSource: string;
    if (this.feature.assets[0].path != '../../images/Image-not-found.png') {
      featureSource =
        this.envService.apiUrl + '/assets/' + this.feature.assets[0].path;
    } else {
      featureSource = this.feature.assets[0].path;
    }
    featureSource = featureSource.replace(/([^:])(\/{2,})/g, '$1/');
    this.featureSource = featureSource;
    this.coordinates = this.feature.geometry.coordinates;

    this.projectsService.activeProject.subscribe((next) => {
      this.activeProject = next;
    });

    this.geoDataService.groups.subscribe((next) => {
      this.groups = next;
    });

    this.groupsService.selectedImages.subscribe((next) => {
      this.selectedImages = next;
      this.imageSelected = this.groupsService.imageSelected(this.feature)
        ? 'img-selected'
        : 'img-unselected';
    });

    this.groupsService.groupToAdd.subscribe((next) => {
      this.groupToAdd = next;
    });

    this.featurePath = this.feature.featurePath();
  }

  imageSelect() {
    this.groupsService.toggleImageSelect(this.feature);
  }

  compareGroup(a, b) {
    return a.name === b.name;
  }

  imageZoom(template: TemplateRef<any>) {
    this.dialog.open(template);
  }

  imageDelete() {
    const featureService = this.featureService;
    this.selectedImages.forEach(function (value) {
      featureService.deleteFeature(value);
    });
    this.groupsService.unselectAllImages();
    this.scrollService.setScrollRestored(true);
  }

  openModal(template: TemplateRef<any>) {
    this.dialog.open(template);
  }

  openPreserveScrollModal(template: TemplateRef<any>) {
    this.scrollService.setScrollPosition();
    this.dialog.open(template);
  }

  deleteFromGroup(feature: Feature, group: TagGroup) {
    this.geoDataService.deleteGroupFeatures(
      this.activeProject.id,
      [feature],
      group
    );
  }

  openImageAddModal(template: TemplateRef<any>) {
    this.scrollService.setScrollPosition();
    this.dialog.open(template);
  }

  changeGroupToAdd(ev: any) {
    this.groupsService.setGroupToAdd(ev.value);
  }

  addGroup(group: TagGroup) {
    this.geoDataService.createGroupFeatures(
      this.activeProject.id,
      [this.feature],
      this.groups.get(group.name)
    );
    this.groupsService.unselectAllImages();
    this.scrollService.setScrollRestored(true);
  }
}
