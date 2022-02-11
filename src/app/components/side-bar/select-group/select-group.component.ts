import { Component, OnInit, OnDestroy, TemplateRef} from '@angular/core';
import {FeatureCollection} from 'geojson';
import { Project } from '../../../models/models';
import { ProjectsService } from '../../../services/projects.service';
import { FormsService } from '../../../services/forms.service';
import { GroupsService} from '../../../services/groups.service';
import { GeoDataService } from '../../../services/geo-data.service';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { templateJitUrl } from '@angular/compiler';
import { Feature } from '@turf/turf';

@Component({
  selector: 'app-select-group',
  templateUrl: './select-group.component.html',
  styleUrls: ['./select-group.component.scss']
})
export class SelectGroupComponent implements OnInit, OnDestroy {

  featureList: Array<any> = [];
  features: FeatureCollection;

  groups$: Subscription;
  activeGroup$: Subscription;

  public selectedProject: Project;

  selectedGroup: string;
  groupList: Array<any>;
  showSidebar: boolean
  activeGroup: string;
  showSubitem: boolean = true;
  
  currentIcon: string = "fa-house-damage";
  choice: string;
  tempGroup: Array<Feature>;

  iconList: Array<any> = [{"id":"fa-house-damage",
							"unicode": "&#xf6f1; house-damage"},
							{"id":"fa-car",
							"unicode": "&#xf1b9; car"},
							{"id":"fa-tree",
							"unicode": "&#xf1bb; tree"},

							{"id":"fa-school",
							"unicode": "&#xf549; school"},
							{"id":"fa-archway",
							"unicode": "&#xf557; archway"},
							{"id":"fa-building",
							"unicode": "&#xf1ad; building"},
							{"id":"fa-bus",
							"unicode": "&#xf207; bus"},
							{"id":"fa-church",
							"unicode": "&#xf51d; church"},

							{"id":"fa-helicopter",
							"unicode": "&#xf533; helicopter"},
							{"id":"fa-hospital-alt",
							"unicode": "&#xf47d; hospital"},
							{"id":"fa-hotel",
							"unicode": "&#xf594; hotel"},
							{"id":"fa-igloo",
							"unicode": "&#xf7ae; igloo"},
							{"id":"fa-motorcycle",
							"unicode": "&#xf21c; motorcycle"},
							{"id":"fa-place-of-worship",
							"unicode": "&#xf67f; place-of-worship"},
							{"id":"fa-plane",
							"unicode": "&#xf072; plane"},
							{"id":"fa-school",
							"unicode": "&#xf549; school"},


							{"id":"fa-rocket",
							"unicode": "&#xf135; rocket"},
							{"id":"fa-ship",
							"unicode": "&#xf21a; ship"},
							{"id":"fa-shopping-cart",
							"unicode": "&#xf07a; shopping-cart"},
							{"id":"fa-shuttle-van",
							"unicode": "&#xf5b6; shuttle-van"},
							{"id":"fa-monument",
							"unicode": "&#xf5a6; monument"},
							{"id":"fa-store",
							"unicode": "&#xf54e; store"},

							{"id":"fa-subway",
							"unicode": "&#xf239; subway"},
							{"id":"fa-taxi",
							"unicode": "&#xf1ba; taxi"},
							{"id":"fa-train",
							"unicode": "&#xf238; train"},
							{"id":"fa-truck",
							"unicode": "&#xf0d1; truck"},
							{"id":"fa-truck-pickup",
							"unicode": "&#xf63c; truck-pickup"},
							{"id":"fa-university",
							"unicode": "&#xf19c; university"},
							{"id":"fa-warehouse",
							"unicode": "&#xf494; warehouse"},
							{"id":"fa-bolt",
							"unicode": "&#xf0e7; bolt"},
							// {"id":"fa-tree",
							// "unicode": "&#xf1bb; tree"},
							// {"id":"fa-tree",
							// "unicode": "&#xf1bb; tree"},
							// {"id":"fa-tree",
							// "unicode": "&#xf1bb; tree"},
							// {"id":"fa-tree",
							// "unicode": "&#xf1bb; tree"},
							// {"id":"fa-tree",
							// "unicode": "&#xf1bb; tree"},
						
						
						];

  constructor(private formsService: FormsService,
			  private groupsService: GroupsService,
			  private geoDataService: GeoDataService,
			  private projectsService: ProjectsService,
			  private dialog: MatDialog) { }

  ngOnInit() {

	// this.geoDataService.features.subscribe( (fc: FeatureCollection) => {
	//   if (fc) {
	// 	this.featureList = fc.features;
	//   }
	// });
	this.geoDataService.features.subscribe( (fc: FeatureCollection) => {
		this.features = fc;
  
		if (this.features != undefined) {
		  this.featureList = this.features.features;
		//   this.groupsService.setActiveProject(this.featureList[0]);
  
		  // TODO This should activate persistence by looping through all features and creating new groups and
		  //
		//   this.groupsService.setGroupProperties(this.featureList);
  
		  // console.log(this.featureList[this.activeFeatureNum].assets[0].path);
		  // this.activeFeature = this.featureList[this.activeFeatureNum];
		}
	  });

	  this.groupsService.tempGroup.subscribe((next) => {
		this.tempGroup = next;
	  });
	//   console.log(this.tempGroup)

	this.projectsService.activeProject.subscribe(next => {
	  this.selectedProject = next;
	});

	this.groups$ = this.groupsService.groups.subscribe((next) => {
	  this.groupList = next;
	});

	// console.log(this.groupList)

	this.activeGroup$ = this.groupsService.activeGroup.subscribe((next) => {
	  this.activeGroup = next;
	});
  }

  selectGroupForm(group: string) {
	this.groupsService.setActiveGroup(group);

	let activeGroup = this.groupList.filter(what => what.name == this.activeGroup);

	if (activeGroup[0].features.length == 0) {
	  this.groupsService.setFeatureImagesExist(false);
	} else {
	  this.groupsService.setFeatureImagesExist(true);
	}
	this.groupsService.setActiveFeatureNum(0);
	this.formsService.changeGroupForm(group);
  }

  openRenameOptionModal(template: TemplateRef<any>) {
	this.dialog.open(template);
  }

  deleteGroup(name: string) {
	let data = this.formsService.getTags();
	while(true){
		const index = data.findIndex(item => item.groupName === name);
		// delete this.exampleNote[index];
		if (index > -1) {
		data.splice(index, 1);
		}else{
			break;
		}
	}
	
	this.groupList.forEach(group => {
		if (group.name == name){
			this.tempGroup = group.features;
			this.groupList = this.groupList.filter(e => e.name != name);
		}
	});

	for (let feat of this.tempGroup){

		let featProp = feat.properties;

		featProp.group = featProp.group.filter(e => e.name != name);

		featProp.tag = data
	
			this.geoDataService.updateFeatureProperty(this.selectedProject.id,
													Number(feat.id),
													featProp);

		this.groupsService.addGroup(this.groupList);
	}

	if (this.groupList.length <= 0) {
	  this.showSidebar = false;
	  this.groupsService.setShowSidebar(this.showSidebar);
	} else {
	  this.groupsService.setActiveGroup(this.groupList[0].name);
	}
  }

  openRenameModal(template: TemplateRef<any>, name: string) {
	this.selectedGroup = name;
	this.dialog.open(template);
  }

  openIconSelection(template: TemplateRef<any>, name:string){
	this.selectedGroup =  name;
	this.dialog.open(template);

  }

  saveIcon(icon: string){
	this.groupList.forEach(e => {
	  if (e.name == this.activeGroup) {
		e.icon = icon;
		this.tempGroup = e.features;	
	  }
	});
	this.groupsService.addGroup(this.groupList);

	let index = 0
	for (let feat of this.tempGroup) {
		let featProp = feat.properties;
		 console.log(feat.id)/*
		// console.log(this.selectedGroup)
		index = this.groupList.findIndex(item => item.features[index].id == feat.id);
		featProp.group = featProp.group.filter(e => e.name != this.selectedGroup);
		// console.log(index)
		if (featProp.group) {
			console.log("nope");
			featProp.group.push({
			  name: this.groupList[index].name,
			  color: this.groupList[index].color,
			  icon: icon
			});
		  }
		this.geoDataService.updateFeatureProperty(this.selectedProject.id, Number(feat.id), featProp );*/
		
	this.groupsService.setActiveGroup(this.activeGroup);
		this.formsService.saveStyles("default", Number(feat.id))
	}


	//   this.currentIcon = icon;
	//   this.groupList.forEach(e => {
	// 	if (e.name == this.selectedGroup) {
	// 	  e.icon = icon;
	// 	}
	//   });
	//   this.groupsService.addGroup(this.groupList);
	//   for (let feat of this.featureList) {
	// 	let featProp = feat.properties;
	// 	let groupProp = this.tempGroup
	// 	console.log(featProp)
	// 	featProp.group = featProp.group.filter(e => e.name != this.activeGroup);
	// 	if (featProp.group) {
	// 		console.log("nope");
	// 		featProp.group.push({
	// 		  name: featProp.name,
	// 		  color: featProp.color,
	// 		  icon: icon
	// 		});
	// 	  }
	// 	this.geoDataService.updateFeatureProperty(this.selectedProject.id, Number(feat.id), featProp );
	// 	this.groupsService.setActiveGroup(this.selectedGroup);
	// }

  }

  isChecked(name: string) {
	if (this.activeGroup == name) {
	  return "checked";
	} else {
	  return "";
	}
  }


  renameGroup(name: string) {
	console.log(this.activeGroup)
	this.groupList.forEach(e => {
	  if (e.name == this.activeGroup) {
		e.name = name;
		this.tempGroup = e.features;	
	  }
	});

	// console.log(this.tempGroup)
	//  console.log(this.groupList)
	this.groupsService.addGroup(this.groupList);

	

	// for (let feat of this.tempGroup){
	// 	console.log(feat)
	// 	let featProp = feat.properties;
	// 	console.log(featProp)
	// 	if (featProp.group) {
	// 		console.log("nope");
	// 		featProp.group.push({
	// 		  name: name,
	// 		//   color: ,
	// 		//   icon: "fa-house-damage"
	// 		});
	// 	  }#23E99E #473FB4
	for (let feat of this.tempGroup) {
		let featProp = feat.properties;
		// console.log(feat.id)
		// console.log(this.selectedGroup)
		const index = this.groupList.findIndex(item => item.features[0].id == feat.id);
		featProp.group = featProp.group.filter(e => e.name != this.selectedGroup);
		// console.log(index)
		if (featProp.group) {
			console.log("nope");
			featProp.group.push({
			  name: name,
			  color: this.groupList[index].color,
			  icon: this.groupList[index].icon
			});
		  }
		this.geoDataService.updateFeatureProperty(this.selectedProject.id, Number(feat.id), featProp );
		
	this.groupsService.setActiveGroup(name);
	}
	// console.log(this.selectedProject.id)
	// console.log(this.tempGroup[0])



	// let activeGroup = this.groupList.filter(what => what.name == this.activeGroup[0].name);

	// if (activeGroup[0].features.length == 0) {
	//   this.groupsService.setFeatureImagesExist(false);
	// } else {
	//   this.groupsService.setFeatureImagesExist(true);
	// }
  }

  expandPanel() {
	this.showSubitem = !this.showSubitem;
	if (this.showSubitem) {

	} else {
	}
  }

  ngOnDestroy() {
	this.groups$.unsubscribe();
	this.activeGroup$.unsubscribe();
  }
}
