import { Component, OnInit, Output, TemplateRef } from '@angular/core';
import { ProjectsService } from '../../services/projects.service';
import { Feature, Project, NewGroup } from '../../models/models';
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
  private REFRESHTIME = 6; // 60 secs per reload default, right now it's an hour (6000 sec) //This is in seconds, and somehow got set to 6
  public projects: Project[];
  public selectedProject: Project;
  public mapMouseLocation: LatLng = new LatLng(0, 0);
  public liveRefresh = true;
  private timer: Observable<number> = interval(this.REFRESHTIME * 1000);
  private timerSubscription: Subscription;
  showGroup: boolean;
  imageName: string;
  showSidebar: boolean;
  groupsExist: boolean;
  groupName: string;
  tempGroup: Array<Feature>;
  modalRef: BsModalRef;
  activeGroup: string;
  groups: Map<string, NewGroup>;
  groupsFeatures: Map<string, any>;
  activeGroupFeatures: any;
  activeGroupFeaturesRotate: any;
  activeGroupFeature: any;
  activePane: string;
  hazMapperLink: string;
  itemsSelected: boolean = false;
  foundFilePaths = [];

  constructor(
    private projectsService: ProjectsService,
    private geoDataService: GeoDataService,
    private bsModalService: BsModalService,
    private groupsService: GroupsService,
    private formsService: FormsService,
    private authService: AuthService,
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
        this.featureList = this.features.features;
        // this.groupsService.setActiveProject(this.featureList[0]);

        // TODO This should activate persistence by looping through all features and creating new groups and
        //Not sure about the above note, if anything needs to be done here, it seems like we have achieved persistance
        this.groupsService.setGroupProperties(this.featureList);
      }
    });

    this.geoDataService.groups.subscribe((next) => {
      this.groups = next;
      this.groupsExist = next && next.size ? true : false;
    });

    combineLatest(
      this.groupsService.activeGroup,
      this.geoDataService.groupsFeatures
    ).subscribe(([grp, grpFts]) => {
      this.activeGroup = grp;
      this.groupsFeatures = grpFts;
      if (grp && grpFts) {
        this.activeGroupFeatures = grpFts.get(grp);
        this.activeGroupFeaturesRotate = [...this.activeGroupFeatures];
        // this.activeGroupFeature = this.activeGroupFeatures[0];
      }
    });

    this.groupsService.activeGroupFeature.subscribe((next) => {
      this.activeGroupFeature = next;
      console.log(next);
    });

    this.groupsService.activePane.subscribe((next) => {
      this.activePane = next;
    });

    this.geoDataService.activeFeature.subscribe((next) => {
      this.activeFeature = next;
      if (this.activeFeature) console.log(this.activeFeature.assets[0].path);
    });

    this.notificationsService.notifications.subscribe((next) => {
      let hasSuccessNotification = next.some(
        (note) => note.status === 'success'
      );
      let hasFailureNotification = next.some((note) => note.status === 'error');
      if (hasSuccessNotification) {
        this.geoDataService.getFeatures(this.selectedProject.id);
        console.log('Features Got');
      }
      if (hasFailureNotification) {
        next.forEach((item) => {
          //Compiles a list of all necessary files to import via the alt method
          //The substring from 0 to 16 contains the phrase "Error importing", everything after this is the file path
          if (
            item.message.substring(0, 16) == 'Error importing ' &&
            !this.foundFilePaths.some(
              (filePath) => filePath === item.message.substring(16)
            )
          ) {
            let path = item.message.substring(16);
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
        try {
          //restores view to the last visited project from local storage
          lastProj = JSON.parse(window.localStorage.getItem('lastProj'));
          console.log(lastProj);
        } catch (error) {
          lastProj = this.projectsService.setActiveProject(this.projects[0]);
        }

        //If lastProj is null, then there is no project saved, or can be found, default to the first project in the list
        if (lastProj == 'none' || lastProj == null) {
          lastProj = this.projects[0];
        }

        this.projectsService.setActiveProject(lastProj);
      }

      // this.groupsService.groups.subscribe((next) => {
      //   this.groupList = next;
      //
      //   if (this.groupList.length > 0) {
      //     this.groupsExist = true;
      //   } else {
      //     this.groupsExist = false;
      //   }
      // });

      // this.groupsService.activeFeatureNum
      //   .pipe(startWith(0))
      //   .subscribe((next) => {
      //     this.activeFeatureNum = next;
      //
      //     this.groupList.forEach((e) => {
      //       if (e.name == this.activeGroup) {
      //         if (e.features[next]) {
      //           if (e.features[next].assets[0].display_path) {
      //             this.imageName = /[^/]*$/.exec(
      //               e.features[next].assets[0].display_path
      //             )[0];
      //           } else {
      //             this.imageName = /[^/]*$/.exec(
      //               e.features[next].assets[0].path
      //             )[0];
      //           }
      //         }
      //       }
      //     });
      //   });

      this.groupsService.tempGroup.subscribe((next) => {
        this.tempGroup = next;
      });

      this.groupsService.showGroup.subscribe((next) => {
        this.showGroup = next;
      });

      this.groupsService.showSidebar.subscribe((next) => {
        this.showSidebar = next;
      });

      this.groupsService.tempGroup.subscribe((next) => {
        this.tempGroup = next;
      });

      this.groupsService.itemsSelected.subscribe((next) => {
        this.itemsSelected = next;
      });
    });

    this.projectsService.activeProject.subscribe((next) => {
      this.selectedProject = next;
      this.getDataForProject(this.selectedProject);
      //retrieves uuid for project, formats result into a link to that Hazmapper map
      this.hazMapperLink =
        'https://hazmapper.tacc.utexas.edu/hazmapper/project/' + next.uuid;
    });

    this.geoDataService.mapMouseLocation.pipe(skip(1)).subscribe((next) => {
      this.mapMouseLocation = next;
    });

    // this.groupsService.setActiveFeatureNum(0);
  }

  clearAll() {
    this.groupsService.setUnselectAll(true);
    this.groupsService.setItemsSelected(false);
  }

  reloadFeatures() {
    this.geoDataService.getFeatures(this.selectedProject.id);
  }

  setLiveRefresh(option: boolean) {
    option
      ? (this.timerSubscription = this.timer.subscribe(() => {
          this.reloadFeatures();
        }))
      : this.timerSubscription.unsubscribe();
  }

  //Similar to setLiveRefresh, but it runs the time out once and then unsubscribes from the timer
  startRefreshTimer(option: boolean) {
    option
      ? (this.timerSubscription = this.timer.subscribe(() => {
          this.reloadFeatures();
          this.setLiveRefresh(false);
        }))
      : this.timerSubscription.unsubscribe();
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
    //Refreshes the list of found paths used in importing images without Geo tagging
    this.foundFilePaths = [];
    const modal = this.dialog.open(ModalFileBrowserComponent);
    modal.afterClosed().subscribe((files: Array<RemoteFile>) => {
      if (files != null) {
        this.geoDataService.importFileFromTapis(this.selectedProject.id, files);
      }
    });
  }

  //Creates a feature with a long/lat value of 0,0 and no associated image. Used in alternate image inport
  //I think if we want a placeholder image, we can add it here.
  createBlankFeature() {
    let blankFeature: Feature = {
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
      console.log(passbackData);
      path = passbackData;
      this.saveFile(path[3] == '.json', true, path[0], path[1], path[2]);
    });
  }

  openCreateProjectModal() {
    this.dialog.open(ModalCreateProjectComponent, {
      height: '400px',
      width: '600px',
    });
    this.dialog.afterAllClosed.subscribe((resp) => {
      //Close the sidebar and return to the gallery screen if the sidebar's open
      if (this.showSidebar) {
        this.openSidebar();
      }
    });
  }

  openShareProjectModal() {
    this.dialog.open(ModalShareProjectComponent, {
      height: '400px',
      width: '600px',
    });
  }

  openProjectModal(project) {
    let modal = this.dialog.open(ModalCurrentProjectComponent, {
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

  //Old function, aside from rewriting it for quality, most concerns here have been addressed. Also, it's not exactly broken... -Ben
  addToGroupService(name: string) {
    this.groupName = name;
    this.groupsService.setActiveGroup(name);
    // if (this.groupList.length != 1000) {
    // TODO Make this better
    if (!name || 0 === name.length) {
      console.log('Invalid Name');
    } else if (this.groups.get(name)) {
      console.log('Existing Name');
    } else {
      const myRandColor: string = this.getRandomColor();
      const newGroup: NewGroup = {
        name: name,
        color: myRandColor,
        icon: 'fa-house-damage',
      };
      this.geoDataService.createGroupFeatures(
        this.selectedProject.id,
        this.tempGroup,
        newGroup
      );
      // let myRandColor: string = this.getRandomColor();
      // this.groupList.push({
      //   name: name,
      //   features: this.tempGroup,
      //   color: myRandColor,
      //   icon: 'fa-house-damage',
      // });
      // this.
      // this.groupsService.addGroup(this.groupList);
      // this.formsService.addGroup(this.groupName);

      // console.log(this.groupList);
      // console.log(this.tempGroup);

      // TODO make this work for persistence //We do currently have persistance, so make of this what you will -Ben
      // for (let feat of this.tempGroup) {
      //   let featProp = feat.properties;
      //   // console.log(feat.properties);
      //
      //   if (featProp.group) {
      //     const myRandColor: string = this.getRandomColor();
      //     const newGroup: NewGroup = {
      //       name: name,
      //       color: myRandColor,
      //       icon: 'fa-house-damage',
      //     };
      //     console.log(this.tempGroup);
      //     console.log(newGroup);
      //     this.geoDataService.createGroupFeatures(
      //       this.selectedProject.id,
      //       this.tempGroup,
      //       newGroup
      //     );
      //     // featProp.group.push({
      //     //   name: name,
      //     //   color: myRandColor,
      //     //   icon: 'fa-house-damage',
      //     // });
      //   } else {
      //     console.log('This is actually happening');
      //     let featPropList = (featProp.group = []);
      //     // featPropList.push({
      //     //   name: name,
      //     //   color: myRandColor,
      //     //   icon: 'fa-house-damage',
      //     // });
      //   }
      //
      //   // this.geoDataService.updateFeatureProperty(
      //   //   this.selectedProject.id,
      //   //
      //   //   Number(feat.id),
      //   //   featProp
      //   // );
      //   // console.log('In control-bar');
      //   // console.log('Current feat: ' + feat.id);
      //   // console.log('featProp: what gets sent to server');
      //   // console.log(featProp);
      //   // console.log('groupList: internal listing');
      // }
      // }
    }

    this.tempGroup = [];
    this.groupsService.addTempGroup(this.tempGroup);
    this.groupsService.setUnselectAll(true);
    this.groupsService.setShowGroup(false);
    this.dialog.closeAll();
  }

  openAddGroupModal(template: TemplateRef<any>) {
    this.dialog.open(template);
  }

  openSidebar() {
    if (!this.showSidebar) {
      this.scrollService.setScrollPosition();
    } else {
      this.scrollService.setScrollRestored(true);
    }
    let showSidebar = !this.showSidebar;
    let showGroup = false;
    const [initialGroupName] = this.groupsFeatures.keys();
    this.groupsService.setActiveGroup(initialGroupName);
    const activeGroupFeatures = this.groupsFeatures.get(initialGroupName);

    // activeGroup.setF
    // const [firstGroup] = this.groups.values();
    // this.geoDataService.setActiveGroup(firstGroup);

    // let activeGroup = this.groupList.filter(
    //   (group) => group.name == this.activeGroup
    // );

    if (activeGroupFeatures && activeGroupFeatures.length > 0) {
      this.groupsService.setFeatureImagesExist(true);
      this.groupsService.setActiveGroupFeature(activeGroupFeatures[0]);
      console.log(activeGroupFeatures[0]);
    } else {
      this.groupsService.setFeatureImagesExist(false);
    }
    //
    this.reloadFeatures();
    // this.groupsService.setActiveFeatureNum(0);
    this.groupsService.setShowSidebar(showSidebar);
    this.groupsService.setShowGroup(showGroup);
    this.router.navigateByUrl('/tagger', { skipLocationChange: true });

    this.tempGroup = [];
    this.groupsService.addTempGroup(this.tempGroup);
    this.groupsService.setUnselectAll(true);
    this.groupsService.setActivePane('tagger');
  }

  getAssetDisplay() {
    if (this.activeGroupFeature.assets[0].display_path) {
      return /[^/]*$/.exec(this.activeGroupFeature.assets[0].display_path)[0];
    } else {
      let apath = /[^/]*$/.exec(this.activeGroupFeature.assets[0].path)[0];
      return apath.slice(0, 15) + '...';
    }
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
    this.groupsService.setActiveGroupFeature(this.activeGroupFeature);
  }

  getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  // TODO
  //This is unused, but the paths are valid routes, mostly seen in the sidebar components.
  //Tagger is the basic sidebar that appears when you oppen the taggit screen, Preset is for tag generation
  goToRoute() {
    if (this.activePane == 'preset') {
      this.groupsService.setActivePane('tagger');
      this.router.navigateByUrl('/tagger', { skipLocationChange: true });
    } else {
      this.groupsService.setActivePane('preset');
      this.router.navigateByUrl('/preset', { skipLocationChange: true });
    }
    this.groupsService.setActiveGroup(this.activeGroup);
  }

  // TODO
  //What there is TODO with this, I don't know. Probably nothing at all...
  clearAndUnselect() {}

  //saves project as a CSV file by first organizing a JSON or a CSV and converting it. Saves to either MyData or local
  //I apologize in advance for this mess of a function -Ben
  //This really needs to be split into something like 3 separate functions
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
    let headerComplete = false; //If true, then the full csv header info has been compiled
    let headerTagOptions = 0; //Controls how many tagOption columns are in the final CSV

    this.featureList.forEach((element) => {
      //Retrieves project ID for building a filename
      projID = element.project_id;

      //retrieves longitude and latitude values as an array
      let coordinates = element.geometry['coordinates'];

      //creates image source URL from environment and cleans up URL to a usable link
      let featureSource =
        environment.apiUrl + '/assets/' + element.assets[0].path;
      featureSource = featureSource.replace(/([^:])(\/{2,})/g, '$1/');

      //Grabs group data
      //Group data can be accessed from the feature, through the properties element
      //If the image doesn't have a group, a placeholder is given
      //NOTE: future group properties can be accessed in the same way
      let group, styles, tag;
      try {
        try {
          group = element.properties['group'];
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
          styles = element.properties['style'];
        } catch {
          styles = [];
        }

        try {
          tag = element.properties['tag'];
        } catch {
          tag = [];
        }

        //If groups are present on the data, add header data
        if (group.length > 0 && !headerComplete) {
          CSVHolder += ',groupName,groupColor,groupIcon';
        }

        //Check if the tag var has any data, if so, add new lines to the header
        if (tag != undefined && tagsPresent && !headerComplete) {
          //Add a few more lines to the holder to accomodate tags
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
          //If not, indent the last line.
          CSVHolder += '\r\n';
          headerComplete = true;
        }
      } catch (error) {}

      if (isJSON) {
        //Compile the data it into a JSON
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
        //Compiles the attributes into a CSV format
        //If there is no groups for the feature, output without group info
        if (group == undefined) {
          //Indents CSV header.
          CSVHolder += '\r\n';
          //Compiles data to a line of a CSV, and adds it to a growing full CSV file
          //			  featureID			 Longitude				Latitude			   src
          let tempCSV =
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
            console.log(group);
            //If tags exist, try to add each tag to the CSV
            if (tag != undefined) {
              try {
                tag.forEach((tag) => {
                  //If the tag is in the group, compile a row
                  //TODO: If a group doesn't have a tag, it doesn't get printed at all
                  if (true) {
                    //(tag.groupName === group.name) {
                    console.log(tag);
                    //			  featureID			 Longitude				Latitude			   src
                    let tempCSV =
                      element.id +
                      ',' +
                      coordinates[0] +
                      ',' +
                      coordinates[1] +
                      ',' +
                      featureSource +
                      ',' +
                      //groupName			groupColor			groupIcon		   Icon					 Color
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
                      //Save each option in the tag to the CSV
                      //Adds just the label to the CSV, we can reconstruct the key from that.
                      tempCSV += ',' + option.label;
                    });
                    tempCSV += '\r\n';
                    //And adds it to a growing full CSV file
                    CSVHolder += tempCSV;
                  }
                });
              } catch {
                try {
                  //If the above fails, attempt to construct a line with group data
                  //			  featureID			 Longitude				Latitude			   src
                  let tempCSV =
                    element.id +
                    ',' +
                    coordinates[0] +
                    ',' +
                    coordinates[1] +
                    ',' +
                    featureSource +
                    ',' +
                    //groupName			groupColor			groupIcon
                    group.name +
                    ',' +
                    group.color +
                    ',' +
                    group.icon +
                    '\r\n';
                  CSVHolder += tempCSV;
                } catch (error) {
                  //If all else fails, It writes no data on an error, so output the groupless data
                  //			  featureID			 Longitude				Latitude			   src
                  let tempCSV =
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
              //Compiles data to a line of a CSV
              //			  featureID			 Longitude				Latitude			   src
              let tempCSV =
                element.id +
                ',' +
                coordinates[0] +
                ',' +
                coordinates[1] +
                ',' +
                featureSource +
                ',' +
                //groupName			groupColor			groupIcon
                group.name +
                ',' +
                group.color +
                ',' +
                group.icon +
                '\r\n';
              //And adds it to a growing full CSV file
              CSVHolder += tempCSV;
            }
          });
        }
      }
    });
    let content;
    let extension;
    //determine whether the file is wanted as a JSON or a CSV
    if (isJSON) {
      content = JSONHolder;
      extension = '.json';
    } else {
      content = CSVHolder;
      extension = '.csv';
    }

    //If the function is marked for export to Design Safe, route through export, otherwise, download the file
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

    //Add the most basic information to the compiled JSON
    transferJSON = {
      longitude: coordinates[0],
      latitude: coordinates[1],
      src: featureSource,
    };
    compiledJSON += JSON.stringify(transferJSON);

    if (groups.length != 0) {
      groups.forEach((group) => {
        //At this point, group info should be added,
        //If tags are set to a default value, there are none present, compile without tag information
        transferJSON = {
          groupName: group.name,
          groupColor: group.color,
        };
        compiledJSON += JSON.stringify(transferJSON);
        if (tags.length > 0) {
          //Compile a JSON with full tag information
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
    //If the above failed, compile the minimum JSON
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
    //Creates a download link in typescript through a blob
    let blob = new Blob(['\ufeff' + content], {
      type: 'text/csv;charset=utf-8;',
    });
    let download = document.createElement('a');
    let url = URL.createObjectURL(blob);
    let filename = 'taggit-proj-' + projID;

    //checks if the browser is Safari or otherwise, if so open download in new window
    //Its a quirk of those browsers that they don't allow same-page downloads
    if (
      navigator.userAgent.indexOf('Safari') != -1 &&
      navigator.userAgent.indexOf('Chrome') == -1
    ) {
      download.setAttribute('target', '_blank');
    }
    //Sets up the link, and simulates a click
    download.setAttribute('href', url);
    download.setAttribute('download', filename + extension);
    download.style.visibility = 'hidden';
    document.body.appendChild(download);
    download.click();
    document.body.removeChild(download);
  }
}
