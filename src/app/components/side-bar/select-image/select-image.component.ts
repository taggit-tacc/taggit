import { Component, OnInit, OnDestroy } from '@angular/core';
import {FeatureCollection} from 'geojson';
import { Project } from '../../../models/models';
import { ProjectsService } from '../../../services/projects.service';
import { GeoDataService } from '../../../services/geo-data.service';
import { FormsService } from '../../../services/forms.service';
import { GroupsService } from '../../../services/groups.service';
import { Subscription } from 'rxjs';
import { Feature } from '@turf/turf';

@Component({
  selector: 'app-select-image',
  templateUrl: './select-image.component.html',
  styleUrls: ['./select-image.component.scss']
})

export class SelectImageComponent implements OnInit, OnDestroy {
  groups$: Subscription;
  activeFeatureNum$: Subscription;
  activeGroup$: Subscription;

  featureList: Array<any> = [];
  public selectedProject: Project;
  groupList: Array<any> = [];
  activeGroup: string;
  activeFeatureNum: number;
  showSidebar: boolean
  showSubitem: boolean = true;
  tempGroup: Array<Feature>;

  constructor(private formsService: FormsService,
			  private groupsService: GroupsService,
			  private geoDataService: GeoDataService,
			  private projectsService: ProjectsService) {}

  ngOnInit() {
	this.geoDataService.features.subscribe( (fc: FeatureCollection) => {
	  if (fc) {
		this.featureList = fc.features;
	  }
	});

	this.projectsService.activeProject.subscribe(next => {
	  this.selectedProject = next;
	});

	this.groups$ = this.groupsService.groups.subscribe((next) => {
	  this.groupList = next;
	});

	this.activeFeatureNum$ = this.groupsService.activeFeatureNum.subscribe((next) => {
	  this.activeFeatureNum = next;
	});

	this.activeGroup$ = this.groupsService.activeGroup.subscribe((next) => {
	  this.activeGroup = next;
	});
  }

  getActiveFeatures() {
	let activeGroupObj = this.groupList.filter(realGroup => realGroup.name === this.activeGroup);
	return activeGroupObj[0].features;
  }

  jumpToImage(asset: any) {
	let index = 0;
	this.groupList.forEach(e => {
	  if (e.name == this.activeGroup) {
		index = e.features.indexOf(asset)
	  }
	});
	this.groupsService.setActiveFeatureNum(index);
  }

  isActiveFeature(asset: any) {
	let index = 0;
	this.groupList.forEach(e => {
	  if (e.name == this.activeGroup) {
		index = e.features.indexOf(asset)
	  }
	});
	return this.activeFeatureNum == index;
  }

  deleteGroup(name: string) {
	
	this.groupList.forEach(group => {
		if (group.name == name){
			this.tempGroup = group.features;
			this.groupList = this.groupList.filter(e => e.name != name);
		}
	});

	for (let feat of this.tempGroup){

		let featProp = feat.properties;

		featProp.group = featProp.group.filter(e => e.name != name);
	
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

  deleteAsset(assetId: any) {
	this.groupList.forEach(group => {
	  if (group.name === this.activeGroup) {
		this.tempGroup = group.features;
		if (group.features.length == 1) {
		  this.deleteGroup(group.name);
		} else {
		  group.features = group.features.filter(asset => asset.id != assetId);

		}
	  }
	});

	for (let feat of this.tempGroup){

	let featProp = feat.properties;
	featProp.group = featProp.group.filter(e => e.name != this.activeGroup);

	this.geoDataService.updateFeatureProperty(this.selectedProject.id,
											  Number(feat.id),
											  featProp);
	this.groupsService.addGroup(this.groupList);
	}}

  getAssetDisplay(asset: any) {
	if (asset.assets[0].display_path) {
	  return /[^/]*$/.exec(asset.assets[0].display_path)[0];
	} else {
	  let apath = /[^/]*$/.exec(asset.assets[0].path)[0];
	  return apath.slice(0, 15) + "..."
	}
  }

  ngOnDestroy() {
	this.groups$.unsubscribe();
	this.activeFeatureNum$.unsubscribe();
	this.activeGroup$.unsubscribe();
  }

  expandPanel() {
	this.showSubitem = !this.showSubitem;
	if (this.showSubitem) {

	} else {
	}
  }
}
