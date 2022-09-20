import { Component, OnInit, OnDestroy, TemplateRef} from '@angular/core';
import { GroupsService } from '../../../services/groups.service';
import { FormsService, tags } from '../../../services/forms.service';
import { MatDialog } from '@angular/material/dialog';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GeoDataService } from 'src/app/services/geo-data.service';
import { Feature, FeatureCollection } from 'geojson';
import { ProjectsService } from 'src/app/services/projects.service';
import { FeatureService } from 'src/app/services/feature.service';

@Component({
  selector: 'app-tag-images',
  templateUrl: './tag-images.component.html',
  styleUrls: ['./tag-images.component.scss']
})
export class TagImagesComponent implements OnInit {
  activeGroup: string;
  payload: any;
  selectedGroup: string;
  openOption: any = {};
  activeFeatureId: number;
  private formGroup$: Subscription;
  private activeGroup$: Subscription;
  private activeFeatureId$: Subscription;
  private groupList;
  private selectedProject;
  form: FormGroup;
  showSubitem = true;
  tagList: tags[] = [];
  newTag: tags[] = [];
  newTagValue = '';
  featureList: Array<any> = [];
  tempGroup: Array<Feature>;

  constructor(
	private groupsService: GroupsService,
	private formsService: FormsService,
	private dialog: MatDialog,
	private router: Router,
	private projectsService: ProjectsService,
	private geoDataService: GeoDataService,
	private featureService: FeatureService) { }

  ngOnInit() {
	this.activeGroup$ = this.activeGroup$ = this.groupsService.activeGroup.subscribe((next) => {
	  this.activeGroup = next;
	});

	this.activeFeatureId$ = this.groupsService.activeFeatureId.subscribe((next) => {
	  this.activeFeatureId = next;
	});

	this.formGroup$ = this.formsService.formGroup.subscribe((next) => {
	  this.form = next;
	});

	this.groupsService.groups.subscribe((next) => {
		this.groupList = next;
	});
	this.projectsService.activeProject.subscribe(next => {
		this.selectedProject = next;
	});

	this.featureService.features$.subscribe( (fc: FeatureCollection) => {
		this.featureList = fc.features;
	  });
	
	this.featureService.tags$.subscribe( tags => {
		this.tagList = tags;
	});

	  // this is to get the list of tags so far
	for (const feat of this.featureList) {
		  if (feat.properties.tag != undefined) {
			  feat.properties.tag.forEach(tag => {
				  const index = this.newTag.findIndex(item => item.groupName === tag.groupName  && item.label === tag.label && item.feature === tag.feature);
					 if (index == -1) {
						this.newTag.push(tag);
					}
			  });
		  }
	  }
  }

  openRenameModal(template: TemplateRef<any>, name: string) {
	this.selectedGroup = name;
	this.dialog.open(template);
  }

  openRenameOptionModal(template: TemplateRef<any>) {
	this.dialog.open(template);
  }
  
  // Takes the name of the tag's group, and the tag itself to delete
   deleteTag(tag: tags) {
	this.featureService.deleteTag(tag);  
   }

  // submits a tag's name change to geoAPI
  renameTag(tag) {
	  this.featureService.renameTag(tag, this.newTagValue);
	  // Reset newTagValue for the next rename
	  this.newTagValue = '';
	  this.dialog.closeAll(); // Ensures the window closes when using enter-submission
	}

  openOptionToggle(label: string) {
	if (this.openOption[label]) {
	  this.openOption[label] = false;
	} else {
	  this.openOption[label] = true;
	}
  }

  createNewTag() {
	this.groupsService.setActivePane('preset');
	this.router.navigateByUrl('/preset', {skipLocationChange: true});
  }

  onSubmit() {
	this.payload = this.form.getRawValue();
  }

  ngOnDestroy() {
	this.formGroup$.unsubscribe();
	this.activeFeatureId$.unsubscribe();
	this.activeGroup$.unsubscribe();
  }

  expandPanel() {
	this.showSubitem = !this.showSubitem;
	if (this.showSubitem) {

	} else {
	}
  }
}
