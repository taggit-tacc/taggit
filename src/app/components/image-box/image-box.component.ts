import {Component, OnInit, EventEmitter, Input, TemplateRef} from '@angular/core';
import {Feature, Project} from '../../models/models';
import {GeoDataService} from '../../services/geo-data.service';
import {AppEnvironment, environment} from '../../../environments/environment';
import {GroupsService} from "../../services/groups.service";
import {ProjectsService} from "../../services/projects.service";
import { BsModalService } from 'ngx-foundation/modal';
import { BsModalRef } from 'ngx-foundation/modal/bs-modal-ref.service';
import { MatDialog } from '@angular/material/dialog';
import { FormsService, tags } from 'src/app/services/forms.service';
import { ScrollService } from 'src/app/services/scroll.service';

@Component({
  selector: 'app-image-box',
  templateUrl: './image-box.component.html',
  styleUrls: ['./image-box.component.scss']
})

export class ImageBoxComponent implements OnInit {
  @Input() feature: Feature;
  // @Output() clickRequest = new EventEmitter<Feature>();
  environment: AppEnvironment;
  featureSource: string;
  featurePath: string;
  status: boolean = false; //Controls the whether or not an image box is selected or not
  hasGroup: boolean = false;
  colors: Array<string> = [];
  groupList: Array<any>;
  coordinates: Array<any>;
  containingGroupList: Array<any>;
  currentGroup: string = "hello";
  tempGroup: Array<Feature>;
  modalRef: BsModalRef;
  activeGroup: string;

  public selectedProject: Project;

  unselectAll: boolean = false;

  tagList: tags[] = this.formsService.getTags();

  // FIXME Bad
  imageCollection: any = {};

  constructor( private geoDataService: GeoDataService,
			   private groupsService: GroupsService,
			   private projectsService: ProjectsService,
			   private modalService: BsModalService,
			   private formsService: FormsService,
			   private dialog: MatDialog,
			   private scrollService: ScrollService
			 ){ }

  ngOnInit() {
	this.environment = environment;
	let featureSource
	if( this.feature.assets[0].path != "../../images/Image-not-found.png") {
		featureSource = this.environment.apiUrl + '/assets/' + this.feature.assets[0].path;
	} else {
		featureSource = this.feature.assets[0].path
	}
	featureSource = featureSource.replace(/([^:])(\/{2,})/g, '$1/');
	this.featureSource = featureSource;
	this.coordinates = this.feature.geometry['coordinates'];

	this.projectsService.activeProject.subscribe(next => {
	  this.selectedProject = next;
	});

	this.groupsService.groups.subscribe((next) => {
	  this.groupList = next;

	  if (this.groupList != null && this.groupList.length > 0 && this.featureSource != null) {
		// console.log(this.groupList)
		
		this.groupList.forEach(e => {
			// console.log(e)
			e.features.forEach(c => {

			if (c.id == this.feature.id) {
			  if (!this.colors.includes(e.color)) {
				this.colors.push(e.color);
				//console.log(e.color);
			  }
			  this.hasGroup = true;
			}
		  });
		});
	  }
	});

	this.groupsService.tempGroup.subscribe((next) => {
	  this.tempGroup = next;
	});

	this.groupsService.activeGroup.subscribe((next) => {
	  this.activeGroup = next;
	});


	this.groupsService.unselectAll.subscribe((next) => {
	  this.unselectAll = next;
	  if (this.unselectAll == true) {
		this.status = false;
	  }
	});
	let featurePath = this.feature.assets[0].display_path
	featurePath = this.feature.assets[0].display_path
	this.featurePath = featurePath
  }

  // click() {
  //   this.clickRequest.emit(this.feature);

  // // imageSelect(event: any) {
  // //   if (event.target.classList.contains('img-selected')) {
  // //     this.renderer.removeClass(event.target, "img-selected");
  // //     this.renderer.addClass(event.target, "img-unselected");
  // //   } else {
  // //     this.renderer.removeClass(event.target, "img-unselected");
  // //     this.renderer.addClass(event.target, "img-selected");
  // //   }
  // // }

  // }
  // delete() {
  //   this.geoDataService.deleteFeature(this.feature);
  // }


  imageSelect() {
	if (this.unselectAll == true) {
	  this.unselectAll = false;
	  this.groupsService.setUnselectAll(false);
	  this.tempGroup = []
	}
	this.status = !this.status;
	if(this.status) {
		this.groupsService.setItemsSelected(this.status)
	}

	if (this.tempGroup.filter(v => v.assets[0].id == this.feature.assets[0].id).length > 0) {
	  this.tempGroup = this.tempGroup.filter(v => v.assets[0].id != this.feature.assets[0].id);
	} else {
	  this.tempGroup.push(this.feature);
	}

	this.groupsService.addTempGroup(this.tempGroup);
	// console.log(this.tempGroup.filter(v => v.assets[0].id == feature.assets[0].id).length > 0)

	// Hide group-bar
	if (this.tempGroup.length == 0) {
	  this.groupsService.setShowGroup(false);
	  this.groupsService.setItemsSelected(false);
	} else {
	  this.groupsService.setShowGroup(true);
	}

  }

  imageZoom(template: TemplateRef<any>) {
	// this.modalRef = this.modalService.show(template, {class: 'full'});
	this.dialog.open(template);
  }

  imageDelete() {
	const geoData = this.geoDataService;
	this.tempGroup.forEach(function (value) {
		geoData.deleteFeature(value);
	})
	//Resets contents of temp group
	this.groupsService.addTempGroup([])
	this.scrollService.setScrollRestored(true)
  }

  openMoreGroupsModal(template: TemplateRef<any>) {
	// this.modalRef = this.modalService.show(template, {class: 'tiny'});
	this.dialog.open(template);
  }

  openImageDeleteModal(template: TemplateRef<any>) {
	this.scrollService.setScrollPosition()
	// this.modalRef = this.modalService.show(template, {class: 'tiny'});
	this.dialog.open(template);
  }

  deleteFromGroup(color: string) {
	// console.log(this.groupList);
	this.groupList.forEach(e => {
	  // When it is the sole feature
	  if (e.features.length <= 1) {
		this.groupList = this.groupList.filter(e => e.color != color);
	  } else {
		if (e.color == color) {
		  e.features = e.features.filter(i => i.id != this.feature.id);
		}
	  }
	});

	let featProp = this.feature.properties;

	featProp.group = featProp.group.filter(e => e.color != color);

	this.geoDataService.updateFeatureProperty(this.selectedProject.id,
											  Number(this.feature.id),
											  featProp);

	this.groupsService.addGroup(this.groupList);
	this.colors = this.colors.filter(e => e != color);
  }

  openImageAddModal(template: TemplateRef<any>) {
	this.scrollService.setScrollPosition()
	// this.modalRef = this.modalService.show(template, {class: 'tiny'});
	this.dialog.open(template);
  }

  selectGroupForm (name: string, feat: Feature) {
	let color = "";
	this.groupsService.setActiveFeatureNum(0);
	this.groupList.forEach(e => {
	  if (e.name == name) {
		//   console.log(this.feature)
		e.features.push(this.feature);
		color = e.color;
	  }
	});

	let featProp = feat.properties;
	if (featProp.group) {
	  let featGroupList = featProp.group.map(e => {
		return e.name;
	  });

	  if (!featGroupList.includes(name)) {
		featProp.group.push({
		  name: name,
		  color: color,
		});
	  }
	} else {
	  featProp.group = [];
	  featProp.group.push({
		name: name,
		color: color,
	  });
	}

	this.groupList.forEach(e => {
		if (e.name == this.activeGroup) {
			this.tempGroup = e.features;	
		}
		});
	// console.log(this.tagList)
	
	for (let tag of this.tagList){
		if (tag.feature === this.tempGroup[0].id && tag.groupName === name){
			let formItem: tags = {
				type: tag.type,
				groupName: name,
				label: tag.label,
				// value: this.formValue,
				// required: this.formRequired,
				options: tag.options,
				feature: this.feature.id,
				extra: []
			}
			this.formsService.saveTag(this.activeGroup, formItem, formItem.label)
		}
	}

	// console.log(name)
	// console.log(featProp)
	// console.log(this.tempGroup[0].id)
	this.geoDataService.updateFeatureProperty(this.selectedProject.id,
											  Number(feat.id),
											  featProp);

	this.groupsService.addGroup(this.groupList);
	//Yes, I know there are two identical lines here. It doesn't work unless it does it twice
	//I don't know why that is, but if you can figure out a better way, go ahead.
	this.geoDataService.getFeatures(Number(feat.project_id));
	this.geoDataService.getFeatures(Number(feat.project_id));
  }

  addGroups(name: string) {
	  this.tempGroup.forEach( (feat) => {
		  this.selectGroupForm(name, feat)
	  })
	  this.groupsService.setUnselectAll(true);
	  this.scrollService.setScrollRestored(true)
	}

  getGroupNameFromColor(color: string) {
	this.groupList.forEach(e => {
	  if (e.color == color) {
		this.currentGroup = e.name;
	  }
	});
  }

}
