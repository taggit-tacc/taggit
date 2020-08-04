import { Component, OnInit, OnDestroy, TemplateRef} from '@angular/core';
import {FeatureCollection} from 'geojson';
import { Project } from '../../../models/models';
import { ProjectsService } from '../../../services/projects.service';
import { FormsService } from '../../../services/forms.service';
import { GroupsService } from '../../../services/groups.service';
import { GeoDataService } from '../../../services/geo-data.service';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-select-group',
  templateUrl: './select-group.component.html',
  styleUrls: ['./select-group.component.scss']
})
export class SelectGroupComponent implements OnInit, OnDestroy {

  featureList: Array<any> = [];

  groups$: Subscription;
  activeGroup$: Subscription;

  public selectedProject: Project;

  selectedGroup: string;
  groupList: Array<any>;
  showSidebar: boolean
  activeGroup: string;
  showSubitem: boolean = true;

  constructor(private formsService: FormsService,
			  private groupsService: GroupsService,
			  private geoDataService: GeoDataService,
			  private projectsService: ProjectsService,
			  private dialog: MatDialog) { }

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

  deleteGroup() {
	this.groupsService.addGroup(this.groupList.filter(what => what.name != this.activeGroup))

	for (let feat of this.featureList) {
	  // this should be a shared group of
	  // all the currently created objects of a particular feature

	  let featProp = feat.properties;
	  featProp.group = featProp.group.filter(e => e.name != this.activeGroup);

	  this.geoDataService.updateFeatureProperty(this.selectedProject.id,
												Number(feat.id),
												featProp);
	}
	if (this.groupList.length <= 0) {
	  this.showSidebar = false;
	  this.groupsService.setShowSidebar(this.showSidebar);
	} else {
	  this.groupsService.setActiveGroup(this.groupList[0].name);

	  // let activeGroup = this.groupList.filter(what => what.name == this.activeGroup[0].name);

	  // if (activeGroup[0].features.length == 0) {
	  //	this.groupsService.setFeatureImagesExist(false);
	  // } else {
	  //	this.groupsService.setFeatureImagesExist(true);
	  // }
	}
  }

  openRenameModal(template: TemplateRef<any>, name: string) {
	this.selectedGroup = name;
	this.dialog.open(template);
  }

  isChecked(name: string) {
	if (this.activeGroup == name) {
	  return "checked";
	} else {
	  return "";
	}
  }

  renameGroup(name: string) {
	this.groupList.forEach(e => {
	  if (e.name == this.selectedGroup) {
		e.name = name;
	  }
	});

	this.groupsService.addGroup(this.groupList);

	this.groupsService.setActiveGroup(name);

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
