import {
  Component,
  OnInit,
  Output,
  TemplateRef,
  ChangeDetectorRef,
} from '@angular/core';
import { ProjectsService } from '../../services/projects.service';
import { Feature, Project, TagGroup } from '../../models/models';
import { FeatureCollection } from 'geojson';
import { AgaveSystemsService } from '../../services/agave-systems.service';
import { GeoDataService } from '../../services/geo-data.service';
import { LatLng } from 'leaflet';
import { skip } from 'rxjs/operators';
import { BsModalRef, BsModalService } from 'ngx-foundation';
import { ModalFileBrowserComponent } from '../modal-file-browser/modal-file-browser.component';
import { ModalDownloadSelectorComponent } from '../modal-download-selector/modal-download-selector.component';
import { ModalCreateProjectComponent } from '../modal-create-project/modal-create-project.component';
import { ModalShareProjectComponent } from '../modal-share-project/modal-share-project.component';
import { combineLatest } from 'rxjs';
import { RemoteFile } from 'ng-tapis';
import { GroupsService } from '../../services/groups.service';
import { FormsService } from '../../services/forms.service';
import {
  AuthenticatedUser,
  AuthService,
} from '../../services/authentication.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ModalCurrentProjectComponent } from '../modal-current-project/modal-current-project.component';
import { EnvService } from '../../services/env.service';
import { TapisFilesService } from '../../services/tapis-files.service';

import { ScrollService } from 'src/app/services/scroll.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { FeatureService } from 'src/app/services/feature.service';
import * as JSZip from 'jszip';

@Component({
  selector: 'app-control-bar',
  templateUrl: './control-bar.component.html',
  styleUrls: ['./control-bar.component.scss'],
})
export class ControlBarComponent implements OnInit {
  public activeFeature: Feature;
  features: FeatureCollection;
  featureList: Array<any> = [];

  public currentUser: AuthenticatedUser;
  public projects: Project[];
  public selectedProject: Project;
  public mapMouseLocation: LatLng = new LatLng(0, 0);
  imageName: string;
  groupsExist: boolean;
  groupName: string;
  showTagger = false;
  selectedImages: Array<any>;
  modalRef: BsModalRef;
  activeGroup: TagGroup;
  groups: Map<string, TagGroup>;
  groupsFeatures: Map<string, any>;
  activeGroupFeatures: any;
  activeGroupFeaturesRotate: any;
  activeGroupFeature: any;
  invalidNameError = false;
  existingNameError = false;
  hazmapperLink: string;
  foundFilePaths = [];
  groupToAdd: TagGroup;
  public activeProject: Project;
  tagFeaturesQueue: any;

  constructor(
    private projectsService: ProjectsService,
    private geoDataService: GeoDataService,
    private bsModalService: BsModalService,
    private groupsService: GroupsService,
    private formsService: FormsService,
    private envService: EnvService,
    private authService: AuthService,
    private readonly cdr: ChangeDetectorRef,
    private filesService: TapisFilesService,
    private agaveSystemsService: AgaveSystemsService,
    private router: Router,
    private dialog: MatDialog,
    private scrollService: ScrollService,
    private notificationsService: NotificationsService,
    private featureService: FeatureService
  ) {}

  ngOnInit() {
    this.filesService.getState();

    this.groupsService.groupToAdd.subscribe((next) => {
      this.groupToAdd = next;
    });

    this.geoDataService.tagFeaturesQueue.subscribe((next) => {
      this.tagFeaturesQueue = next;
    });

    this.featureService.features$.subscribe((fc: FeatureCollection) => {
      this.features = fc;

      if (this.features != undefined) {
        this.featureList = fc.features.filter(
          (feature: Feature) =>
            feature.assets.length &&
            feature.initialAsset() &&
            feature.featureType() === 'image'
        );
      }
    });

    this.geoDataService.groups.subscribe((next) => {
      this.groups = next;
      this.groupsExist = next && next.size ? true : false;
    });

    this.projectsService.activeProject.subscribe((next) => {
      this.activeProject = next;
    });

    combineLatest(
      this.geoDataService.activeGroup,
      this.geoDataService.groupsFeatures
    ).subscribe(([grp, grpFts]) => {
      this.activeGroup = grp;
      this.groupsFeatures = grpFts;
      if (grp && grpFts) {
        this.activeGroupFeatures = grpFts.get(grp.name);
        if (this.activeGroupFeatures) {
          this.activeGroupFeaturesRotate = [...this.activeGroupFeatures];
        }
      }
    });

    this.geoDataService.activeGroupFeature.subscribe((next) => {
      this.activeGroupFeature = next;
    });

    this.geoDataService.activeFeature.subscribe((next) => {
      this.activeFeature = next;
    });

    this.notificationsService.notifications.subscribe((next) => {
      const hasSuccessNotification = next.some(
        (note) => note.status === 'success'
      );
      const hasFailureNotification = next.some(
        (note) => note.status === 'error'
      );
      if (hasSuccessNotification) {
        this.geoDataService.getFeatures(this.selectedProject.id);
      }
      if (hasFailureNotification) {
        next.forEach((item) => {
          // Compiles a list of all necessary files to import via the alt method
          // The substring from 0 to 16 contains the phrase "Error importing", everything after this is the file path
          if (
            item.message.substring(0, 16) == 'Error importing ' &&
            !this.foundFilePaths.some(
              (filePath) => filePath === item.message.substring(16)
            )
          ) {
            const path = item.message.substring(16);
            this.geoDataService.uploadNewFeature(
              this.selectedProject.id,
              this.createBlankFeature(),
              path
            );
            this.foundFilePaths.push(path);
          }
        });
        this.geoDataService.getFeatures(this.selectedProject.id);
      }
    });

    this.authService.currentUser.subscribe((next) => (this.currentUser = next));

    this.projectsService.getProjects();
    this.agaveSystemsService.list();

    combineLatest([this.projectsService.projects, this.agaveSystemsService.projects]).subscribe(([projects, dsProjects]) => {
      this.projects = this.agaveSystemsService.getProjectMetadata(projects, dsProjects);

      // restores view to the last visited project from local storage
      let lastProject = null;
      try {
        lastProject = JSON.parse(window.localStorage.getItem(this.projectsService.getLastProjectKeyword()));
      } catch (error) {
        // possible that lastProj item is null and not json
        lastProject = null;
      }

      if (projects.length) {
        const selectedLastProject = lastProject
          ? this.projects.find((prj) => prj.id === lastProject.id)
          : null;
        if (selectedLastProject) {
          this.projectsService.setActiveProject(selectedLastProject);
        } else {
          // default to the first project in the list
          this.projectsService.setActiveProject(this.projects[0]);
        }
      }
    });

    this.groupsService.selectedImages.subscribe((next) => {
      this.selectedImages = next;
    });

    this.groupsService.showTagger.subscribe((next) => {
      this.showTagger = next;
    });

    this.projectsService.activeProject.subscribe((next) => {
      this.selectedProject = next;
      if (this.selectedProject) {
        this.getDataForProject(this.selectedProject);
        // retrieves uuid for project, formats result into a link to that Hazmapper map
        this.hazmapperLink =
          'https://hazmapper.tacc.utexas.edu/hazmapper/project/' + next.uuid;
      }
    });

    this.geoDataService.mapMouseLocation.pipe(skip(1)).subscribe((next) => {
      this.mapMouseLocation = next;
    });
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  clearAll() {
    this.groupsService.unselectAllImages();
  }

  compareGroup(a, b) {
    return a.name === b.name;
  }

  changeGroupToAdd(ev: any) {
    this.groupsService.setGroupToAdd(ev.value);
  }

  selectProject(p: Project): void {
    this.projectsService.setActiveProject(p);
  }

  getDataForProject(p: Project): void {
    this.geoDataService.getFeatures(p.id);
    this.geoDataService.getOverlays(p.id);
    this.geoDataService.getPointClouds(p.id);
  }

  openFilePicker() {
    // Refreshes the list of found paths used in importing images without Geo tagging
    this.foundFilePaths = [];
    const modal = this.dialog.open(ModalFileBrowserComponent);
    modal.afterClosed().subscribe((files: Array<RemoteFile>) => {
      if (files != null) {
        this.geoDataService.importFileFromTapis(this.selectedProject.id, files);
      }
    });
  }

  // Creates a feature with a long/lat value of 0,0 and no associated image. Used in alternate image inport
  // I think if we want a placeholder image, we can add it here.
  createBlankFeature() {
    const blankFeature: Feature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, 0],
      },
      properties: {},
    };
    return blankFeature;
  }

  openDownloadSelector(fileName: string) {

    if (this.groups.size === 0) {
      this.notificationsService.showErrorToast('No groups have been created for this gallery. Please create at least one group.');
    } else {
      const modal = this.dialog.open(ModalDownloadSelectorComponent);
      let path: Array<string>;
      modal.afterClosed().subscribe((passbackData: Array<string>) => {
        path = passbackData;
        this.saveFile(true, path[0], path[1], path[2]);
      });
    }
  }

  openCreateProjectModal() {
    this.dialog.open(ModalCreateProjectComponent, {
      height: '400px',
      width: '600px',
    });
  }

  openShareProjectModal() {
    this.dialog.open(ModalShareProjectComponent, {
      height: '400px',
      width: '600px',
    });
  }

  openProjectModal(project) {
    const modal = this.dialog.open(ModalCurrentProjectComponent, {
      height: '400px',
      width: '600px',
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        uuid: project.uuid,
      },
    });
  }

  addGroup(name: string) {
    this.groupName = name;
    if (!name || 0 === name.length) {
      this.invalidNameError = true;
      this.existingNameError = false;
    } else if (this.groups.get(name)) {
      this.invalidNameError = false;
      this.existingNameError = true;
    } else {
      this.invalidNameError = false;
      this.existingNameError = false;
      const newGroup = this.geoDataService.createNewGroup(
        this.selectedProject.id,
        this.selectedImages,
        name
      );
      this.dialog.closeAll();
      this.groupsService.unselectAllImages();
    }
  }

  addToGroup(group: TagGroup) {
    this.geoDataService.createGroupFeatures(
      this.activeProject.id,
      this.selectedImages,
      this.groups.get(group.name)
    );
    this.groupsService.unselectAllImages();
    this.scrollService.setScrollRestored(true);
  }
  openAddGroupModal(template: TemplateRef<any>) {
    this.dialog.open(template);
  }

  toggleTagger() {
    if (!this.showTagger) {
      this.scrollService.setScrollPosition();

      const [initialGroupName] = this.groupsFeatures.keys();
      const activeGroupFeatures = this.groupsFeatures.get(initialGroupName);
      const activeGroup = this.groups.get(initialGroupName);
      this.geoDataService.setActiveGroup(activeGroup);

      this.groupsService.setShowTagGenerator(false);
      this.groupsService.unselectAllImages();
    } else {
      this.scrollService.setScrollRestored(true);
    }

    this.groupsService.toggleTagger();
  }

  getAssetDisplay() {
    return this.activeGroupFeature.featureShortPath();
  }

  otherPath(dir: boolean) {
    if (dir) {
      this.activeGroupFeaturesRotate.push(
        this.activeGroupFeaturesRotate.shift()
      );
    } else {
      this.activeGroupFeaturesRotate.unshift(
        this.activeGroupFeaturesRotate.pop()
      );
    }
    this.activeGroupFeature = this.activeGroupFeaturesRotate[0];
    this.geoDataService.setActiveGroupFeature(this.activeGroupFeature);
  }

  // Flattens feature keys and remove redundant one
  getCSVHeaders(exportFeatures: any): any[] {
    return [...new Set(exportFeatures.flatMap((ef: any) => Object.keys(ef)))];
  }

  exportList() {
    const exportList = [];

    this.groups.forEach((e) => {
      const exportGroupObj = {};
      exportGroupObj['groupName'] = e.name;
      const groupFeatures = this.groupsFeatures.get(e.name);
      exportGroupObj['features'] = [];

      const forms = e.forms;

      groupFeatures.forEach((groupFeature) => {
        let featureSource =
          this.envService.apiUrl + '/assets/' + groupFeature.assets[0].path;

        featureSource = featureSource.replace(/([^:])(\/{2,})/g, '$1/');
        const coordinates = groupFeature.geometry.coordinates;
        const tags = groupFeature.properties.taggit.tags;
        const featureObj = {
          src: featureSource,
          id: groupFeature.id,
          longitude: coordinates[0],
          latitude: coordinates[1],
          groupName: e.name,
          icon: e.icon,
          color: e.color,
        };

        if (forms && tags) {
          forms.forEach((f) => {
            const tag = tags.find((t) => {
              return f.id === t.id;
            });
            if (tag) {
              const label = f.label.charAt(0).toUpperCase() + f.label.slice(1);
              featureObj['Tag' + label + 'Type'] = f.type;
              featureObj['Tag' + label + 'Value'] =
                f.type === 'checkbox'
                  ? tag.value.map((v) => v.label).join('|')
                  : tag.value;
            }
          });
        }
        exportGroupObj['features'].push(featureObj);
      });
      exportList.push(exportGroupObj);
    });
    return exportList;
  }

  saveFile(
    forExport: Boolean = false,
    systemID = '',
    path = '',
    fileName = ''
  ) {
    if (this.groups.size === 0) {
      this.notificationsService.showErrorToast('No groups have been created for this gallery. Please create at least one group.');
    } else {
      const exportList = this.exportList();
      const filename = fileName ? fileName : 'taggit-proj-' + this.selectedProject.name;
 
      // JSON
      const jsonContent = JSON.stringify(exportList);
      const jsonBlob = new Blob(['\ufeff' + jsonContent], {
        type: 'text/json;charset=utf-8;',
      });

      // CSV
      const csvFiles = exportList.map((exportItem) => {
        const csvRows = [];
        const headers = this.getCSVHeaders(exportItem.features);
        csvRows.push(headers.join(','));

        exportItem.features.forEach((ef) => {
          const values = headers.map((header) =>
            ef[header] ? ef[header] : ''
          );
          csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
      });

      // Create ZIP
      const zip = new JSZip();
      const jsonFolder = zip.folder("json");
      const csvFolder = zip.folder("csv");

      jsonFolder.file('data.json', jsonBlob);

      csvFiles.forEach((csv, i) => {
        csvFolder.file(`group-${i}.csv`, csv);
      });

      zip.generateAsync({ type: 'blob' }).then((content) => {
        if (forExport) {
          this.filesService.export(systemID, path, filename, '.zip', content);
        } else {
          this.download(content, '.zip', filename);
        }
      });
    }
  }

  download(content, extension, filename) {
    // Creates a download link in typescript through a blob
    const download = document.createElement('a');
    const url = window.URL.createObjectURL(content);

    // checks if the browser is Safari or otherwise, if so open download in new window
    // Its a quirk of those browsers that they don't allow same-page downloads
    if (
      navigator.userAgent.indexOf('Safari') != -1 &&
      navigator.userAgent.indexOf('Chrome') == -1
    ) {
      download.setAttribute('target', '_blank');
    }
    // Sets up the link, and simulates a click
    download.setAttribute('href', url);
    download.setAttribute('download', filename + extension);
    download.style.visibility = 'hidden';
    document.body.appendChild(download);
    download.click();
    document.body.removeChild(download);

    window.URL.revokeObjectURL(url);
  }

  saveTags(ev) {
    this.geoDataService.updateTagFeaturesQueue(this.activeProject.id);
  }
}
