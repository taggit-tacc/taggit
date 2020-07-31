import {Component, OnInit, EventEmitter, Input, TemplateRef} from '@angular/core';
import {Feature} from '../../models/models';
import {GeoDataService} from '../../services/geo-data.service';
import {AppEnvironment, environment} from '../../../environments/environment';
import {GroupsService} from "../../services/groups.service";
import { BsModalService } from 'ngx-foundation/modal';
import { BsModalRef } from 'ngx-foundation/modal/bs-modal-ref.service';
import { MatDialog } from '@angular/material/dialog';

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
  status: boolean = false;
  hasGroup: boolean = false;
  colors: Array<string> = [];
  groupList: Array<any>;
  coordinates: Array<any>;
  containingGroupList: Array<any>;
  // This is for tooltip
  currentGroup: string = "hello";
  tempGroup: Array<Feature>;
  modalRef: BsModalRef;
  activeGroup: string;

  unselectAll: boolean = false;

  // FIXME Bad
  imageCollection: any = {};

  constructor( private geoDataService: GeoDataService,
			   private groupsService: GroupsService,
			   private modalService: BsModalService,
			   private dialog: MatDialog
			 ){ }

  ngOnInit() {
	this.environment = environment;
	let featureSource = this.environment.apiUrl + '/assets/' + this.feature.assets[0].path;
	featureSource = featureSource.replace(/([^:])(\/{2,})/g, '$1/');
	this.featureSource = featureSource;

	this.coordinates = this.feature.geometry['coordinates'];
	// console.log(coordinates[0]);

	this.groupsService.groups.subscribe((next) => {
	  this.groupList = next;

	  if (this.groupList != null && this.groupList.length > 0 && this.featureSource != null) {
		let theGroups = this.groupList.forEach(e => {
		  e.features.forEach(c => {

			if (c.id == this.feature.id) {
			  if (!this.colors.includes(e.color)) {
				this.colors.push(e.color);
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
	}
	this.status = !this.status;

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
	} else {
	  this.groupsService.setShowGroup(true);
	}

  }

  imageZoom(template: TemplateRef<any>) {
	// this.modalRef = this.modalService.show(template, {class: 'full'});
	this.dialog.open(template);
  }

  imageDelete() {
	this.geoDataService.deleteFeature(this.feature);
  }

  openMoreGroupsModal(template: TemplateRef<any>) {
	// this.modalRef = this.modalService.show(template, {class: 'tiny'});
	this.dialog.open(template);
  }

  openImageDeleteModal(template: TemplateRef<any>) {
	// this.modalRef = this.modalService.show(template, {class: 'tiny'});
	this.dialog.open(template);
  }

  deleteFromGroup(color: string) {
	console.log(this.groupList);
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

	this.groupsService.addGroup(this.groupList);
	this.colors = this.colors.filter(e => e != color);
  }

  openImageAddModal(template: TemplateRef<any>) {
	// this.modalRef = this.modalService.show(template, {class: 'tiny'});
	this.dialog.open(template);
  }

  selectGroupForm (name: string) {
	this.groupsService.setActiveFeatureNum(0);
	this.groupList.forEach(e => {
	  if (e.name == name) {
		e.features.push(this.feature);
	  }
	});

	this.groupsService.addGroup(this.groupList);
  }

  getGroupNameFromColor(color: string) {
	this.groupList.forEach(e => {
	  if (e.color == color) {
		this.currentGroup = e.name;
	  }
	});
  }

}
