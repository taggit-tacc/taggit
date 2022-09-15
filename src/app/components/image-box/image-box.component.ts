import {
  Component,
  OnInit,
  EventEmitter,
  Input,
  TemplateRef,
} from '@angular/core';
import { Feature, Project, NewGroup } from '../../models/models';
import { GeoDataService } from '../../services/geo-data.service';
import { AppEnvironment, environment } from '../../../environments/environment';
import { GroupsService } from '../../services/groups.service';
import { ProjectsService } from '../../services/projects.service';
import { BsModalService } from 'ngx-foundation/modal';
import { BsModalRef } from 'ngx-foundation/modal/bs-modal-ref.service';
import { MatDialog } from '@angular/material/dialog';
import { FormsService, tags } from 'src/app/services/forms.service';
import { ScrollService } from 'src/app/services/scroll.service';
import { FeatureService } from 'src/app/services/feature.service';

@Component({
  selector: 'app-image-box',
  templateUrl: './image-box.component.html',
  styleUrls: ['./image-box.component.scss'],
})
export class ImageBoxComponent implements OnInit {
  @Input() feature: Feature;
  environment: AppEnvironment;
  featureSource: string;
  featurePath: string;
  status: boolean = false; //Controls the whether or not an image box is selected or not
  imageSelected: string = 'img-unselected'; //Controls the whether or not an image box is selected or not
  hasGroup: boolean = false;
  colors: Array<string> = [];
  groups: Map<string, NewGroup>;
  coordinates: Array<any>;
  containingGroupList: Array<any>;
  selectedImages: Array<any>;
  modalRef: BsModalRef;
  groupToAdd: NewGroup;

  public activeProject: Project;

  unselectAll: boolean = false;

  constructor(
    private geoDataService: GeoDataService,
    private groupsService: GroupsService,
    private projectsService: ProjectsService,
    private modalService: BsModalService,
    private formsService: FormsService,
    private dialog: MatDialog,
    private scrollService: ScrollService,
    private featureService: FeatureService
  ) {}

  ngOnInit() {
    // TODO: put this in models
    this.environment = environment;
    let featureSource;
    if (this.feature.assets[0].path != '../../images/Image-not-found.png') {
      featureSource =
        this.environment.apiUrl + '/assets/' + this.feature.assets[0].path;
    } else {
      featureSource = this.feature.assets[0].path;
    }
    featureSource = featureSource.replace(/([^:])(\/{2,})/g, '$1/');
    this.featureSource = featureSource;
    this.coordinates = this.feature.geometry['coordinates'];

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

    this.groupsService.unselectAll.subscribe((next) => {
      this.unselectAll = next;
      if (this.unselectAll == true) {
        this.status = false;
      }
    });
    this.featurePath = this.feature.featurePath();
  }

  imageSelect() {
    this.groupsService.toggleImageSelect(this.feature);
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

  openMoreGroupsModal(template: TemplateRef<any>) {
    this.dialog.open(template);
  }

  openImageDeleteModal(template: TemplateRef<any>) {
    this.scrollService.setScrollPosition();
    this.dialog.open(template);
  }

  deleteFromGroup(feature: Feature, group: NewGroup) {
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

  addGroup(group: NewGroup) {
    this.geoDataService.createGroupFeatures(
      this.activeProject.id,
      this.selectedImages,
      this.groups.get(group.name)
    );
    this.groupsService.unselectAllImages();
    this.scrollService.setScrollRestored(true);
  }
}
