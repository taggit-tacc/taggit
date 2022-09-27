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
import { GeoDataService } from '../../services/geo-data.service';
import { LatLng } from 'leaflet';
import { skip, startWith } from 'rxjs/operators';
import { BsModalRef, BsModalService } from 'ngx-foundation';
import { ModalFileBrowserComponent } from '../modal-file-browser/modal-file-browser.component';
import { ModalDownloadSelectorComponent } from '../modal-download-selector/modal-download-selector.component';
import { ModalCreateProjectComponent } from '../modal-create-project/modal-create-project.component';
import { ModalShareProjectComponent } from '../modal-share-project/modal-share-project.component';
import { interval, Observable, Subscription, combineLatest } from 'rxjs';
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
import { AppEnvironment, environment } from '../../../environments/environment';
import { feature } from '@turf/helpers';
import { TapisFilesService } from '../../services/tapis-files.service';
import { element } from 'protractor';
import { consoleTestResultHandler } from 'tslint/lib/test';
import { ScrollService } from 'src/app/services/scroll.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { FeatureService } from 'src/app/services/feature.service';

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

  constructor(
    private projectsService: ProjectsService,
    private geoDataService: GeoDataService,
    private bsModalService: BsModalService,
    private groupsService: GroupsService,
    private formsService: FormsService,
    private authService: AuthService,
    private readonly cdr: ChangeDetectorRef,
    private filesService: TapisFilesService,
    private router: Router,
    private dialog: MatDialog,
    private scrollService: ScrollService,
    private notificationsService: NotificationsService,
    private featureService: FeatureService
  ) {}

  ngOnInit() {
    this.filesService.getState();

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
    this.projectsService.projects.subscribe((projects) => {
      this.projects = projects;

      if (this.projects.length) {
        let lastProj;
        // try {
        //   //restores view to the last visited project from local storage
        //   lastProj = JSON.parse(window.localStorage.getItem('lastProj'));
        //   // console.log(lastProj);
        // } catch (error) {
        //   lastProj = this.projectsService.setActiveProject(this.projects[0]);
        // }

        lastProj = this.projectsService.setActiveProject(this.projects[0]);

        // If lastProj is null, then there is no project saved, or can be found, default to the first project in the list
        if (lastProj == 'none' || lastProj == null) {
          lastProj = this.projects[0];
        }

        this.projectsService.setActiveProject(lastProj);
      }

      this.groupsService.selectedImages.subscribe((next) => {
        this.selectedImages = next;
      });

      this.groupsService.showTagger.subscribe((next) => {
        this.showTagger = next;
      });
    });

    this.projectsService.activeProject.subscribe((next) => {
      this.selectedProject = next;
      this.getDataForProject(this.selectedProject);
      // retrieves uuid for project, formats result into a link to that Hazmapper map
      this.hazmapperLink =
        'https://hazmapper.tacc.utexas.edu/hazmapper/project/' + next.uuid;
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

  selectProject(p: Project): void {
    this.projectsService.setActiveProject(p);
    this.getDataForProject(p);
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
    const modal = this.dialog.open(ModalDownloadSelectorComponent);
    let path: Array<string>;
    modal.afterClosed().subscribe((passbackData: Array<string>) => {
      path = passbackData;
      this.saveFile(path[3] == '.json', true, path[0], path[1], path[2]);
    });
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

    modal.afterClosed().subscribe((passbackData: Array<string>) => {
      this.projectsService.setActiveProject(this.projects[0]);
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

  openAddGroupModal(template: TemplateRef<any>) {
    this.dialog.open(template);
  }

  toggleTagger() {
    if (!this.showTagger) {
      this.scrollService.setScrollRestored(true);

      const [initialGroupName] = this.groupsFeatures.keys();
      const activeGroupFeatures = this.groupsFeatures.get(initialGroupName);
      const activeGroup = this.groups.get(initialGroupName);
      this.geoDataService.setActiveGroup(activeGroup);

      this.groupsService.setShowTagGenerator(false);
      this.groupsService.unselectAllImages();
    } else {
      this.scrollService.setScrollPosition();
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

  // saves project as a CSV file by first organizing a JSON or a CSV and converting it. Saves to either MyData or local
  // I apologize in advance for this mess of a function -Ben
  // This really needs to be split into something like 3 separate functions
  saveFile(
    isJSON: Boolean,
    forExport: Boolean = false,
    systemID = '',
    path = '',
    fileName
  ) {
    let CSVHolder = 'FeatureID,longitude,latitude,src';
    let JSONHolder: String = '';
    let projID = '';
    let tagsPresent = true;
    let headerComplete = false; // If true, then the full csv header info has been compiled
    let headerTagOptions = 0; // Controls how many tagOption columns are in the final CSV

    this.featureList.forEach((element) => {
      // Retrieves project ID for building a filename
      projID = element.project_id;

      // retrieves longitude and latitude values as an array
      const coordinates = element.geometry.coordinates;

      // creates image source URL from environment and cleans up URL to a usable link
      let featureSource =
        environment.apiUrl + '/assets/' + element.assets[0].path;
      featureSource = featureSource.replace(/([^:])(\/{2,})/g, '$1/');

      // Grabs group data
      // Group data can be accessed from the feature, through the properties element
      // If the image doesn't have a group, a placeholder is given
      // NOTE: future group properties can be accessed in the same way
      let group, styles, tag;
      try {
        try {
          group = element.properties.group;
        } catch {
          group = [
            {
              color: '#000000',
              name: 'N/A',
              icon: 'fa-house-damage',
            },
          ];
        }

        try {
          styles = element.properties.style;
        } catch {
          styles = [];
        }

        try {
          tag = element.properties.tag;
        } catch {
          tag = [];
        }

        // If groups are present on the data, add header data
        if (group.length > 0 && !headerComplete) {
          CSVHolder += ',groupName,groupColor,groupIcon';
        }

        // Check if the tag var has any data, if so, add new lines to the header
        if (tag != undefined && tagsPresent && !headerComplete) {
          // Add a few more lines to the holder to accomodate tags
          CSVHolder += ',Icon,Color,tagType,tagSelection';
          tag.forEach((tag) => {
            let tempTagOptionNum = 0;
            tag.options.forEach((option) => {
              tempTagOptionNum++;
              if (tempTagOptionNum > headerTagOptions) {
                CSVHolder += ',tagOption';
                headerTagOptions = tempTagOptionNum;
              }
            });
          });
          if (!headerComplete) {
            CSVHolder += '\r\n';
            tagsPresent = false;
            headerComplete = true;
          }
        } else if (!headerComplete) {
          // If not, indent the last line.
          CSVHolder += '\r\n';
          headerComplete = true;
        }
      } catch (error) {}

      if (isJSON) {
        // Compile the data it into a JSON
        JSONHolder +=
          this.compileJSON(
            coordinates,
            element.id,
            featureSource,
            group,
            tag,
            styles
          ) + ', \n';
      } else {
        // Compiles the attributes into a CSV format
        // If there is no groups for the feature, output without group info
        if (group == undefined) {
          // Indents CSV header.
          CSVHolder += '\r\n';
          // Compiles data to a line of a CSV, and adds it to a growing full CSV file
          // 			  featureID			 Longitude				Latitude			   src
          const tempCSV =
            element.id +
            ',' +
            coordinates[0] +
            ',' +
            coordinates[1] +
            ',' +
            featureSource +
            '\r\n';
          CSVHolder += tempCSV;
        } else {
          group.forEach((group) => {
            // If tags exist, try to add each tag to the CSV
            if (tag != undefined) {
              try {
                tag.forEach((tag) => {
                  // If the tag is in the group, compile a row
                  // TODO: If a group doesn't have a tag, it doesn't get printed at all
                  if (true) {
                    // (tag.groupName === group.name) {
                    // 			  featureID			 Longitude				Latitude			   src
                    let tempCSV =
                      element.id +
                      ',' +
                      coordinates[0] +
                      ',' +
                      coordinates[1] +
                      ',' +
                      featureSource +
                      ',' +
                      // groupName			groupColor			groupIcon		   Icon					 Color
                      group.name +
                      ',' +
                      group.color +
                      ',' +
                      group.icon +
                      ',' +
                      styles.faIcon +
                      ',' +
                      styles.color +
                      ',' +
                      // tagType			tagOption(This is repeated a lot)
                      tag.type +
                      ',' +
                      tag.extra[0].option;
                    tag.options.forEach((option) => {
                      // Save each option in the tag to the CSV
                      // Adds just the label to the CSV, we can reconstruct the key from that.
                      tempCSV += ',' + option.label;
                    });
                    tempCSV += '\r\n';
                    // And adds it to a growing full CSV file
                    CSVHolder += tempCSV;
                  }
                });
              } catch {
                try {
                  // If the above fails, attempt to construct a line with group data
                  // 			  featureID			 Longitude				Latitude			   src
                  const tempCSV =
                    element.id +
                    ',' +
                    coordinates[0] +
                    ',' +
                    coordinates[1] +
                    ',' +
                    featureSource +
                    ',' +
                    // groupName			groupColor			groupIcon
                    group.name +
                    ',' +
                    group.color +
                    ',' +
                    group.icon +
                    '\r\n';
                  CSVHolder += tempCSV;
                } catch (error) {
                  // If all else fails, It writes no data on an error, so output the groupless data
                  // 			  featureID			 Longitude				Latitude			   src
                  const tempCSV =
                    element.id +
                    ',' +
                    coordinates[0] +
                    ',' +
                    coordinates[1] +
                    ',' +
                    featureSource +
                    '\r\n';
                  CSVHolder += tempCSV;
                }
              }
            } else {
              // Compiles data to a line of a CSV
              // 			  featureID			 Longitude				Latitude			   src
              const tempCSV =
                element.id +
                ',' +
                coordinates[0] +
                ',' +
                coordinates[1] +
                ',' +
                featureSource +
                ',' +
                // groupName			groupColor			groupIcon
                group.name +
                ',' +
                group.color +
                ',' +
                group.icon +
                '\r\n';
              // And adds it to a growing full CSV file
              CSVHolder += tempCSV;
            }
          });
        }
      }
    });
    let content;
    let extension;
    // determine whether the file is wanted as a JSON or a CSV
    if (isJSON) {
      content = JSONHolder;
      extension = '.json';
    } else {
      content = CSVHolder;
      extension = '.csv';
    }

    // If the function is marked for export to Design Safe, route through export, otherwise, download the file
    if (forExport) {
      fileName == ''
        ? (fileName = projID + extension)
        : (fileName += extension);
      this.filesService.export(systemID, path, fileName, extension, content);
    } else {
      this.download(content, extension, projID);
    }
  }

  compileJSON(
    coordinates,
    featureID,
    featureSource: string,
    groups = [],
    tags = [],
    style
  ) {
    let compiledJSON = '';
    let transferJSON;

    // Add the most basic information to the compiled JSON
    transferJSON = {
      longitude: coordinates[0],
      latitude: coordinates[1],
      src: featureSource,
    };
    compiledJSON += JSON.stringify(transferJSON);

    if (groups.length != 0) {
      groups.forEach((group) => {
        // At this point, group info should be added,
        // If tags are set to a default value, there are none present, compile without tag information
        transferJSON = {
          groupName: group.name,
          groupColor: group.color,
        };
        compiledJSON += JSON.stringify(transferJSON);
        if (tags.length > 0) {
          // Compile a JSON with full tag information
          tags.forEach((tag) => {
            if (tag.feature == featureID) {
              transferJSON = {
                icon: style.faIcon,
                'icon color': style.color,
                'tag name': tag.label,
                'tag type': tag.type,
                'tag selection': tag.extra[0].option,
              };
              compiledJSON += JSON.stringify(transferJSON);
            }
          });
        }
      });
    }
    // If the above failed, compile the minimum JSON
    if (compiledJSON == '') {
      transferJSON = {
        longitude: coordinates[0],
        latitude: coordinates[1],
        src: featureSource,
      };
      compiledJSON += JSON.stringify(transferJSON);
    }
    return compiledJSON;
  }

  download(content, extension, projID) {
    // Creates a download link in typescript through a blob
    const blob = new Blob(['\ufeff' + content], {
      type: 'text/csv;charset=utf-8;',
    });
    const download = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const filename = 'taggit-proj-' + projID;

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
  }
}
