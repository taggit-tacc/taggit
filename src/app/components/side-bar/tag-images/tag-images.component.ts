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
import { tag } from '@turf/turf';
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
  private selectedProject
  form: FormGroup;
  showSubitem: boolean = true;
  tagList: tags[] = this.formsService.getTags();
  newTag: tags[] = [];
  newTagValue = ""
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

	  // this is to get the list of tags so far
	  for (let feat of this.featureList){
		  if(feat.properties.tag != undefined){
			  feat.properties.tag.forEach(tag => {
				  const index = this.newTag.findIndex(item => item.groupName === tag.groupName  && item.label === tag.label && item.feature === tag.feature);
					if(index == -1){
						this.newTag.push(tag)
					}
			  });
		  }
	  }
	  console.log(this.tagList)
	//   console.log(this.newTag)
  }

  openRenameModal(template: TemplateRef<any>, name: string) {
	this.selectedGroup = name;
	this.dialog.open(template);
  }

  openRenameOptionModal(template: TemplateRef<any>) {
	this.dialog.open(template);
  }
  
  deleteTag(gName: string, tag: tags){
	this.tagList = this.featureService.removeTag(this.tagList, gName, tag, this.groupList, this.activeGroup)
   }

  //submits a tag's name change to geoAPI
	renameTag(tagLabel) {
		let activeTag = this.tagList.find(tag => tag.label === tagLabel)
		let activeFeature = this.featureList.find(feature => feature.id === +activeTag.feature)

		//Remove any tags not in the active group from the working tag list
		let oldTags = this.tagList.filter(item =>  item.groupName == this.activeGroup )

		//update the name of every tag that needs changing
		oldTags.forEach(tag => {
			if ( tag.label == tagLabel ) {
				tag.label = this.newTagValue
			}
		})
		//Reset newTagValue for the next rename
		this.newTagValue = ''

		//Update each feature's tag list and send it to the API for update
		this.featureList.forEach(feature =>{
			feature.properties.tag = oldTags
			this.geoDataService.updateFeatureProperty(activeFeature.project_id, feature.id, feature.properties)
		})

		this.dialog.closeAll() //Ensures the window closes when using enter-submission
  	}


  openOptionToggle(label: string) {
	if (this.openOption[label]) {
	  this.openOption[label] = false;
	} else {
	  this.openOption[label] = true;
	}
  }

  createNewTag() {
	console.log(this.tagList)
	  this.groupsService.setActivePane("preset");
	  this.router.navigateByUrl('/preset', {skipLocationChange: true});
  }

  onSubmit() {
	this.payload = this.form.getRawValue();
	console.log(this.tagList)
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
