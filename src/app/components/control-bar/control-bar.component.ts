import { Component, OnInit, TemplateRef } from '@angular/core';
import { ProjectsService } from '../../services/projects.service';
import { Feature, Project } from '../../models/models';
import {FeatureCollection} from 'geojson';
import { GeoDataService } from '../../services/geo-data.service';
import {LatLng} from 'leaflet';
import {skip, startWith} from 'rxjs/operators';
import {BsModalRef, BsModalService} from 'ngx-foundation';
import {ModalFileBrowserComponent} from '../modal-file-browser/modal-file-browser.component';
import {ModalCreateProjectComponent} from '../modal-create-project/modal-create-project.component';
import {interval, Observable, Subscription} from 'rxjs';
import {RemoteFile} from 'ng-tapis';
import {GroupsService} from "../../services/groups.service";
import {FormsService} from "../../services/forms.service";
import {AuthenticatedUser, AuthService} from '../../services/authentication.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

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
  private REFRESHTIME = 60; // 60 secs per reload
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

  constructor(private projectsService: ProjectsService,
			  private geoDataService: GeoDataService,
			  private bsModalService: BsModalService,
			  private groupsService: GroupsService,
			  private formsService: FormsService,
			  private authService: AuthService,
			  private router: Router,
			  private dialog: MatDialog) {}

  ngOnInit() {


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
		this.projectsService.setActiveProject(this.projects[0]);
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
	this.timerSubscription = this.timer.subscribe( () => {
	  this.reloadFeatures();
	});

	// FIXME Maybe redundant
	this.groupsService.setActiveFeatureNum(0);
  }

  reloadFeatures() {
	this.geoDataService.getFeatures(this.selectedProject.id);
  }

  setLiveRefresh(option: boolean) {
	option ? this.timerSubscription = this.timer.subscribe(() => { this.reloadFeatures(); }) : this.timerSubscription.unsubscribe();
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
	  this.geoDataService.importFileFromTapis(this.selectedProject.id, files);
	});

	// const modal: BsModalRef = this.bsModalService.show(ModalFileBrowserComponent);
	// modal.content.onClose.subscribe( (files: Array<RemoteFile>) => {
	//   this.geoDataService.importFileFromTapis(this.selectedProject.id, files);
	// });
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
		  // featureIds: Object.keys(this.tempGroup),
		});
		this.groupsService.addGroup(this.groupList);
		this.formsService.addGroup(this.groupName);

		// TODO make this work for persistence
		for (let feat of this.tempGroup) {
		  // this should be a shared group of
		  // all the currently created objects of a particular feature

		  // let featProp = {group: []};

		  let featProp = feat.properties;

		  if (featProp.group) {
			console.log("nope");
			featProp.group.push({
			  name: name,
			  color: myRandColor,
			});
		  } else {
			console.log("This is actually happening");
			let featPropList = featProp.group = [];
			featPropList.push({
			  name: name,
			  color: myRandColor,
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


}
