import { Component, OnInit, TemplateRef } from '@angular/core';
import { ProjectsService } from '../../services/projects.service';
import { Feature, Project } from '../../models/models';
import {FeatureCollection} from 'geojson';
import { GeoDataService } from '../../services/geo-data.service';
import {LatLng} from 'leaflet';
import {skip, startWith} from 'rxjs/operators';
import {BsModalRef, BsModalService} from 'ngx-foundation';
import {ModalFileBrowserComponent} from '../modal-file-browser/modal-file-browser.component';
import {ModalDownloadSelectorComponent} from '../modal-download-selector/modal-download-selector.component';
import {ModalCreateProjectComponent} from '../modal-create-project/modal-create-project.component';
import {ModalShareProjectComponent} from '../modal-share-project/modal-share-project.component';
import {interval, Observable, Subscription} from 'rxjs';
import {RemoteFile} from 'ng-tapis';
import {GroupsService} from "../../services/groups.service";
import {FormsService} from "../../services/forms.service";
import {AuthenticatedUser, AuthService} from '../../services/authentication.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ModalCurrentProjectComponent } from '../modal-current-project/modal-current-project.component';
import {AppEnvironment, environment} from '../../../environments/environment';
import { feature } from '@turf/helpers';
import { TapisFilesService } from '../../services/tapis-files.service'
import { element } from 'protractor';
import { consoleTestResultHandler } from 'tslint/lib/test';
import { ScrollService } from 'src/app/services/scroll.service';

@Component({
  selector: 'app-control-bar',
  templateUrl: './control-bar.component.html',
  styleUrls: ['./control-bar.component.scss']
})
export class ControlBarComponent implements OnInit {

  public activeFeature: Feature;
  features: FeatureCollection;
  featureList: Array<any> = [];
  activeFeatureNum: number;

  public currentUser: AuthenticatedUser;
  private REFRESHTIME = 6; // 60 secs per reload default, right now it's an hour (6000 sec)
  public projects: Project[];
  public selectedProject: Project;
  public mapMouseLocation: LatLng = new LatLng(0, 0);
  public liveRefresh = true;
  private timer: Observable<number> = interval(this.REFRESHTIME * 1000);
  private timerSubscription: Subscription;
  groupList: Array<any>;
  showGroup: boolean;
  imageName: string;
  showSidebar: boolean;
  groupsExist: boolean;
  groupName: string;
  tempGroup: Array<Feature>;
  modalRef: BsModalRef;
  activeGroup: string;
  activePane: string;
  hazMapperLink: string;
  itemsSelected:boolean = false;

  constructor(private projectsService: ProjectsService,
			  private geoDataService: GeoDataService,
			  private bsModalService: BsModalService,
			  private groupsService: GroupsService,
			  private formsService: FormsService,
			  private authService: AuthService,
			  private filesService: TapisFilesService,
			  private router: Router,
			  private dialog: MatDialog,
			  private scrollService: ScrollService) {}

  ngOnInit() {
	  this.filesService.getState()

	this.geoDataService.features.subscribe( (fc: FeatureCollection) => {
	  this.features = fc;

	  if (this.features != undefined) {
		this.featureList = this.features.features;
		this.groupsService.setActiveProject(this.featureList[0]);

		// TODO This should activate persistence by looping through all features and creating new groups and
		//
		this.groupsService.setGroupProperties(this.featureList);

		// console.log(this.featureList[this.activeFeatureNum].assets[0].path);
		// this.activeFeature = this.featureList[this.activeFeatureNum];
	  }
	});

	this.groupsService.activeGroup.subscribe((next) => {
	  this.activeGroup = next;
	});

	this.groupsService.activePane.subscribe((next) => {
	  this.activePane = next;
	});

	this.geoDataService.activeFeature.subscribe((next) => {
	  this.activeFeature = next;
	  if (this.activeFeature)
		console.log(this.activeFeature.assets[0].path);
	});

	this.authService.currentUser.subscribe(next => this.currentUser = next);

	this.projectsService.getProjects();
	this.projectsService.projects.subscribe( (projects) => {
	  this.projects = projects;

	  if (this.projects.length) {
		let lastProj
		try {
			//restores view to the last visited project from local storage
			lastProj = JSON.parse(window.localStorage.getItem("lastProj"))
		} catch (error) {
			lastProj = this.projectsService.setActiveProject(this.projects[0]);
		}
		console.log(window.localStorage.getItem("lastProj"))

		//If lastProj is null, then there is no project saved, or can be found, default to the first project in the list
		if(lastProj == "none" || lastProj == null) {
			lastProj = this.projectsService.setActiveProject(this.projects[0]);
		}
		this.projectsService.setActiveProject(lastProj);
	  }

	  this.groupsService.groups.subscribe((next) => {
		this.groupList = next;

		if (this.groupList.length > 0) {
		  this.groupsExist = true;
		} else {
		  this.groupsExist = false;
		}
	  });

	  this.groupsService.activeFeatureNum.pipe(startWith(0)).subscribe((next) => {
		this.activeFeatureNum = next;

		this.groupList.forEach(e => {
		  if (e.name == this.activeGroup) {
			if (e.features[next]) {
			  if (e.features[next].assets[0].display_path) {
				this.imageName = /[^/]*$/.exec(e.features[next].assets[0].display_path)[0];
			  } else {
				this.imageName = /[^/]*$/.exec(e.features[next].assets[0].path)[0];
			  }
			}
		  }
		});
	  });

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
	  })
	  //this.setLiveRefresh(true)
	});

	this.projectsService.activeProject.subscribe(next => {
	  this.selectedProject = next;
	  this.getDataForProject(this.selectedProject);
	  //retrieves uuid for project, formats result into a link to that Hazmapper map
	  this.hazMapperLink = "https://hazmapper.tacc.utexas.edu/hazmapper/project/" + next.uuid
	});

	this.geoDataService.mapMouseLocation.pipe(skip(1)).subscribe( (next) => {
	  this.mapMouseLocation = next;
	});
	// this.timerSubscription = this.timer.subscribe( () => {
	//   this.reloadFeatures();
	// });

	// FIXME Maybe redundant
	this.groupsService.setActiveFeatureNum(0);
  }

  clearAll(){
	  this.groupsService.setUnselectAll(true);
	  this.groupsService.setItemsSelected(false);
  }

  reloadFeatures() {
	this.geoDataService.getFeatures(this.selectedProject.id);
  }

  setLiveRefresh(option: boolean) {
	option ? this.timerSubscription = this.timer.subscribe(() => { this.reloadFeatures(); }) : this.timerSubscription.unsubscribe();
  }

  //Similar to setLiveRefresh, but it runs the time out once and then unsubscribes from the timer
  startRefreshTimer(option: boolean) {
	option ? this.timerSubscription = this.timer.subscribe(() => { this.reloadFeatures(); this.setLiveRefresh(false)}) : this.timerSubscription.unsubscribe();
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
	const modal = this.dialog.open(ModalFileBrowserComponent);
	modal.afterClosed().subscribe( (files: Array<RemoteFile>) => {
		if (files != null) {this.geoDataService.importFileFromTapis(this.selectedProject.id, files); this.startRefreshTimer(true)}
	});

	// const modal: BsModalRef = this.bsModalService.show(ModalFileBrowserComponent);
	// modal.content.onClose.subscribe( (files: Array<RemoteFile>) => {
	//   this.geoDataService.importFileFromTapis(this.selectedProject.id, files);
	// });
  }

  openDownloadSelector(fileName:string){
	const modal = this.dialog.open(ModalDownloadSelectorComponent);
	let path: Array<string>
	modal.afterClosed().subscribe( (passbackData: Array<string>) => {
		console.log(passbackData)
		path = passbackData
		this.saveFile(path[3] == ".json", true, path[0], path[1], path[2])
	});
  }

  // nameGroup(event: any) {
  //	this.groupName = event;
  //	this.groupsService.setActiveGroup(event.toLowerCase());
  // }

  openCreateProjectModal() {
	this.dialog.open(ModalCreateProjectComponent, {
	  height: '400px',
	  width: '600px',
	});

	// modal.afterClosed().subscribe( (files: Array<RemoteFile>) => {
	//   this.geoDataService.importFileFromTapis(this.selectedProject.id, files);
	// });
  }

  openShareProjectModal(){
	  this.dialog.open(ModalShareProjectComponent, {
		  height: '400px',
		  width: '600px',
	  })
  }

  openProjectModal(project) {
	// console.log(project);
	this.dialog.open(ModalCurrentProjectComponent, {
	  height: '400px',
	  width: '600px',
	  data: {
		id: project.id,
		name: project.name,
		description: project.description,
		uuid: project.uuid
	  }
	});
}

  // TODO This should add color
  addToGroupService(name: string) {
	// TODO: add group data (name) to Individual Feature property
	// for (this.featureIds) {
	//   for this.projectsService.features {
	//	if project feature id = this.fatureids {
	//	  project feature.properties[groupName] = this.groupName;
	//	}
	//   }
	// }

	this.groupName = name;
	// this.groupsService.setActiveGroup(name.toLowerCase());
	this.groupsService.setActiveGroup(name);


	// let activeGroup = this.groupList.filter(group => group.name == name);

	// if (activeGroup[0].features.length == 0) {
	//   this.groupsService.setFeatureImagesExist(false);
	// } else {
	//   this.groupsService.setFeatureImagesExist(true);
	// }

	if (this.groupList.length != 1000) {
	  // TODO Make this better
	  if (!name || 0 === name.length) {
		console.log("Invalid Name");
	  } else if (this.groupList.filter(e => e.name === name).length) {
		console.log("Existing Name");
	  } else {
		let myRandColor: string = this.getRandomColor();
		this.groupList.push({
		  name: name,
		  features: this.tempGroup,
		  color: myRandColor,
		  icon: "fa-house-damage"
		  // featureIds: Object.keys(this.tempGroup),
		});
		this.groupsService.addGroup(this.groupList);
		this.formsService.addGroup(this.groupName);

		console.log(this.groupList)
		console.log(this.tempGroup)

		// TODO make this work for persistence
		for (let feat of this.tempGroup) {
		  // this should be a shared group of
		  // all the currently created objects of a particular feature

		  // let featProp = {group: []};

		  let featProp = feat.properties;
		  console.log(feat.properties)

		  if (featProp.group) {
			console.log("nope");
			featProp.group.push({
			  name: name,
			  color: myRandColor,
			  icon: "fa-house-damage"
			});
		  } else {
			console.log("This is actually happening");
			let featPropList = featProp.group = [];
			featPropList.push({
			  name: name,
			  color: myRandColor,
			  icon: "fa-house-damage"
			});
		  }

		  this.geoDataService.updateFeatureProperty(this.selectedProject.id,
													Number(feat.id),
													featProp);
		  console.log("In control-bar");
		  console.log("Current feat: " + feat.id);
		  console.log("featProp: what gets sent to server");
		  console.log(featProp);
		  console.log("groupList: internal listing");
		  // console.log(this.groupList);
		}
		// TODO Also should create parser that loops through all features and generates groups in an object
	  }
	}

	// TODO Clear input value
	// this.filterName = '';
	// Also clear selection
	this.tempGroup = [];
	this.groupsService.addTempGroup(this.tempGroup);
	this.groupsService.setUnselectAll(true);
	this.groupsService.setShowGroup(false);
  }

  openAddGroupModal(template: TemplateRef<any>) {
	this.dialog.open(template);
	// this.modalRef = this.bsModalService.show(template, {class: 'tiny'});
  }

  openSidebar() {
	if( !this.showSidebar) {
		let scrollPos = document.documentElement.scrollTop
		this.scrollService.setScrollPosition(scrollPos)
	} else {
		this.scrollService.setScrollRestored(true)
	}
	let showSidebar = !this.showSidebar;
	let showGroup = false;
	// let showGroupButton = !this.showGroupButton;
	this.groupsService.setActiveGroup(this.groupList[0].name);

	let activeGroup = this.groupList.filter(group => group.name == this.activeGroup);

	if (activeGroup[0].features.length == 0) {
	  this.groupsService.setFeatureImagesExist(false);
	} else {
	  this.groupsService.setFeatureImagesExist(true);
	}

	this.groupsService.setActiveFeatureNum(0);
	this.groupsService.setShowSidebar(showSidebar);
	this.groupsService.setShowGroup(showGroup);
	this.router.navigateByUrl('/tagger', { skipLocationChange: true });

	this.tempGroup = [];
	this.groupsService.addTempGroup(this.tempGroup);
	this.groupsService.setUnselectAll(true);
	this.groupsService.setActivePane('tagger');
  }

  // TODO Make it prettier
  otherPath(dir: boolean) {
	let activeGroupObj = this.groupList.filter(realGroup => realGroup.name === this.activeGroup);

	// right
	if (dir) {
	  this.activeFeatureNum += 1;
	  this.activeFeatureNum = this.activeFeatureNum % activeGroupObj[0].features.length;
	  // this.activeFeature = this.tempGroup[this.activeFeatureNum];
	} else {
	  if (this.activeFeatureNum == 0) {
		this.activeFeatureNum = activeGroupObj[0].features.length;
	  }
	  this.activeFeatureNum -= 1;
	  // this.activeFeature = this.tempGroup[this.activeFeatureNum];
	}

	// console.log(this.activeFeatureNum);
	// console.log(this.activeFeature.assets[0].path);

	this.groupsService.setActiveFeatureNum(this.activeFeatureNum);
	// console.log(this.activeGroup);
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
  goToRoute() {
	if (this.activePane == "preset") {
	  this.groupsService.setActivePane("tagger");
	  this.router.navigateByUrl('/tagger', {skipLocationChange: true});
	} else {
	  this.groupsService.setActivePane("preset");
	  this.router.navigateByUrl('/preset', {skipLocationChange: true});
	}
	this.groupsService.setActiveGroup(this.activeGroup);

	// let activeGroup = this.groupList.filter(what => what.name == this.activeGroup);

	// if (activeGroup[0].features.length == 0) {
	//   this.groupsService.setFeatureImagesExist(false);
	// } else {
	//   this.groupsService.setFeatureImagesExist(true);
	// }

  }

  // TODO
  clearAndUnselect() {

  }

  //saves project as a CSV file by first organizing a JSON or a CSV and converting it. Saves to either MyData or local
  saveFile(isJSON:Boolean, forExport:Boolean = false, systemID = "", path = "", fileName) {
	  let CSVHolder = "longitude,latitude,src,groupName,groupColor\r\n"
	  let JSONHolder: Array<object> = []
	  let projID = ""

	  this.featureList.forEach(element => {
			//Retrieves project ID for building a filename
			projID = element.project_id

		  	//retrieves longitude and latitude values as an array
			let coordinates = element.geometry['coordinates']

			//creates image source URL from environment and cleans up URL to a usable link
			let featureSource = environment.apiUrl + '/assets/' + element.assets[0].path;
			featureSource = featureSource.replace(/([^:])(\/{2,})/g, '$1/');

			//Grabs group data
			//Group data can be accessed from the feature, through the properties element
			//If the image doesn't have a group, a placeholder is given
			//NOTE: future group properties can be accessed in the same way
			let groupName:String = ""
			let groupColor:String = ""
			try {
				groupName = element.properties['group'][0].name
				groupColor = element.properties['group'][0].color	
			} catch (error) {
				groupName = "N/A"
				groupColor = "#000000"
			}

			if (isJSON) {
				//Alternately compiles it into a JSON
				let transferJSON = {
					"longitude": coordinates[0],
					"latitude": coordinates[1],
					"src": featureSource,
					"groupName": groupName,
					"groupColor": groupColor
				}
				//And adds it to a growing list of JSON objects
				JSONHolder.push(transferJSON)
			
			} else {
				//Compiles the attributes into a CSV format
				let tempCSV = coordinates[0] + "," + coordinates[1] + "," + featureSource + "," + groupName + "," + groupColor + "\r\n"
				//And adds it to a growing full CSV file
				CSVHolder += tempCSV
			}
	  });
	  let content
	  let extension
	  //determine whether the file is wanted as a JSON or a CSV
		if (isJSON) {
			content = JSONHolder
			extension = ".json"
		} else {
			content = CSVHolder
			extension = ".csv"
		}

		//If the function is marked for export to Design Safe, route through export, otherwise, download the file
		if(forExport){
			((fileName == "")? (fileName = projID + extension): (fileName += extension))
			this.filesService.export(systemID, path, fileName, extension, content)
		}else{
			this.download(content,extension,projID)
		}

  }
	
	download(content, extension, projID){
	  //Creates a download link in typescript through a blob
		let blob = new Blob(['\ufeff' + content], {type: 'text/csv;charset=utf-8;' })
		let download = document.createElement("a")
		let url = URL.createObjectURL(blob)
		let filename = "taggit-proj-" + projID

		//checks if the browser is Safari or otherwise, if so open download in new window
		if (navigator.userAgent.indexOf('Safari')!= -1 && navigator.userAgent.indexOf('Chrome') == -1) {
			download.setAttribute("target", "_blank")
		}
		//Sets up the link, and simulates a click
		download.setAttribute("href", url)
		download.setAttribute("download", filename + extension)
		download.style.visibility = "hidden"
		document.body.appendChild(download)
		download.click()
		document.body.removeChild(download)
  	}
}
