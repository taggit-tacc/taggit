import { Component, OnInit, TemplateRef, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsService, tags } from '../../../services/forms.service';
import { GroupsService } from '../../../services/groups.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Feature, Project } from 'src/app/models/models';
import { feature } from '@turf/turf';
import { GeoDataService } from 'src/app/services/geo-data.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { FeatureCollection } from 'geojson';


@Component({
  selector: 'app-tag-generator',
  templateUrl: './tag-generator.component.html',
  styleUrls: ['./tag-generator.component.scss']
})
export class TagGeneratorComponent implements OnInit {
  formLabel: string;
  formOptions: Array<any> = [];
  selectedGroup: string;
  showOpt: string;
  formType: string;
  changed: boolean = false;
  labelFilter: string;
  formItemList: Array<any> = [];
  activeGroup: string;
  optionFilter: string;
  formName: string;
  formValue: string;
  formRequired: boolean;
  openOption: any = {};
  enabledControls: Array<string> = [];
  showSubitem: boolean = true;
  activeFormList: Array<any>;
  groupList: Array<any>;
  groups$: Subscription;
  tempGroup: Array<Feature>;
  private selectedProject;
  featureList: Array<any> = [];
  features: FeatureCollection;
  newTag: object[] = [];
  newGroup:object[] = [];

  constructor(
	private formsService: FormsService,
	private groupsService: GroupsService,
	private dialog: MatDialog,
	private router: Router,
	private geoDataService: GeoDataService,
	private projectsService: ProjectsService,) { }

  ngOnInit() {
	this.groupsService.activeGroup.subscribe((next) => {
	  this.activeGroup = next;
	});

	this.formsService.activeFormList.subscribe((next) => {
	  this.activeFormList = next;
	});

	this.groups$ = this.groupsService.groups.subscribe((next) => {
		this.groupList = next;
	  });

	this.projectsService.activeProject.subscribe(next => {
		this.selectedProject = next;
		//retrieves uuid for project, formats result into a link to that Hazmapper map
		// this.hazMapperLink = "https://hazmapper.tacc.utexas.edu/hazmapper/project/" + next.uuid
	});

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


	this.formOptions = [];
	this.formItemList = [];
	this.formType = 'text';
	this.formName = '';
	this.formLabel = '';
	this.formValue = '';
	this.formRequired = false;
	this.enabledControls = ["Text", "Checkbox", "Radio", "Dropdown", "Color"];
  }

  inputFormLabel (event: any) {
	// this.formLabel = event.target.value.toLowerCase();
	this.formLabel = event.target.value;
  }

  addOptionItem(value: string) {
	if (value) {
	  let formWithValue = this.formOptions.filter(e => e.label == value);
	  if (formWithValue.length == 0 && value.length != 0) {
		this.formOptions.push({
		  key: value[0],
		  label: value,
		});
	  }
	}
  }

  deleteOption(opt: any) {
	this.formOptions = this.formOptions.filter(option => option.label != opt.label);
  }

  openRenameModal(template: TemplateRef<any>, name: string) {
	this.selectedGroup = name;
	this.dialog.open(template);
  }

  openRenameOptionModal(template: TemplateRef<any>) {
	this.dialog.open(template);
  }


  renameOption(opt: any, label: string) {
	if (this.showOpt == "show-option") {
	  this.showOpt = "no-show-option";
	} else {
	  this.showOpt = "show-option";
	}

	label = label.toLowerCase();
	this.formOptions.forEach(e => {
	  if (e.label == opt.label) {
		e.label = label;
	  }
	});
  }

  selectInputForm (name: string) {
	this.formType = name;
	this.formLabel = '';
	this.formOptions = [];
  }

  clearOption() {
	this.optionFilter = '';
  }

  clearLabel() {
	this.labelFilter = '';
  }

  addFormItem() {
	let icon:string
	let payload
	// let formValueFilter = this.activeFormList.filter(e => e.label == this.formLabel);
	// if (formValueFilter.length == 0 && this.formLabel.length != 0) {
	this.groupList.forEach(group => {
		if (group.name == this.activeGroup) {
			this.tempGroup = group.features;
				icon = group.icon
	
				//Creates a temporary group with a copy of the current groups info
				let tempGroup = [{
					name: group.name,
					color: group.color,
					icon: group.icon
				}]
				
				//And adds the temp group to a payload along with the necessary style infromation
				payload = {
					group: tempGroup,
					style: {
						faIcon: icon,
						color: '#00C8FF'
					},
					tag:[]
				}
				// console.log(payload)
			
		}
		});


		// console.log(this.groupList)


		// console.log(this.tempGroup)
		for (let feat of this.tempGroup) {

			// console.log(this.groupList)

			if(feat.properties.tag != undefined || feat.properties.tag != []){
				// feat.properties.tag.forEach(tag => {
				//   this.newTag.push(tag)
				// });
				// console.log(feat.properties)
				// console.log(this.activeGroup)
				if(feat.properties.group.length > 1){
					feat.properties.group.forEach(group => {
						if(group.name != this.activeGroup){
							let tempGroup = {
								name: group.name,
								color: group.color,
								icon: group.icon
							}
						payload.group.push(tempGroup)
						// console.log(this.groupList)

					}
						
					});
				}
				else {
					console.log("duck")
				}
			}
			// console.log(this.newGroup)
			// console.log(this.newTag)
			  
			let formItem: tags = {
				type: this.formType,
				groupName: this.formName,
				label: this.formLabel,
				// value: this.formValue,
				// required: this.formRequired,
				options: [],
				feature: feat.id,
				extra: []
			}
			this.openOption[this.formLabel] = false;

			if (this.formType !== "text" && this.formOptions.length != 0) {
				let myOpts = [];
				for (const opt of this.formOptions) {
				  myOpts.push({
					key: opt[0],
					label: opt,
					// image:
				  })
				}
		
				formItem.options = this.formOptions;
			  }

			  payload.tag = this.formsService.getTags();

			  // code from here is a mess
			//   if(feat.properties.tag != undefined){
			// 	feat.properties.tag.forEach(tag => {
			// 		const index = payload.tag.findIndex(item => item.groupName === tag.groupName  && item.label === tag.label && item.feature === tag.feature);
			// 	  	if(index == -1) {payload.tag.push(tag)}

			// 	});
			// }

			// payload.group.push(this.groupList)

			// feat.properties.group.forEach(groupList => {
			// 	payload.group.push(groupList)
			// });

			// console.log(this.groupList)

			//   console.log(payload)
			//   console.log(feat.id)
			// console.log(typeof(formItem))
			// payload.tag.push(this.newTag)
			// console.log(payload.tag[0])
			// console.log(!payload.tag[0].hasOwnProperty("groupName"))
			// if(payload.tag[0] == undefined ){
			// 	payload.tag[0] = formItem
			// }else{
			// 	if(!payload.tag[0].hasOwnProperty("groupName")){payload.tag[0] = formItem}
			// 	else {payload.tag.push(formItem)}
			// }
			// console.log(typeof(payload.tag))
			// console.log(payload)

			// console.log(this.groupList)

			this.formItemList.push(formItem);
			// this.formsService.addForm(this.activeGroup, formItem);
			  this.formsService.saveTag(this.activeGroup, formItem, formItem.label)
			this.geoDataService.updateFeatureProperty(this.selectedProject.id, Number(feat.id), payload)
			// Clear out the tag section
			
			// console.log(this.groupList)
			
			payload.tag = []
			this.newGroup = []
	}

	  this.formLabel = '';
	  this.formOptions = [];
	  this.labelFilter = '';
	  this.changed = true;
	  
	//   console.log(this.featureList)
	  
	  this.groupsService.setActivePane("tagger");
	  this.router.navigateByUrl('/tagger', {skipLocationChange: true});
	// }
  }

  cancelCreate() {
	this.groupsService.setActivePane("tagger");
	this.router.navigateByUrl('/tagger', {skipLocationChange: true});
  }

  expandPanel() {
	this.showSubitem = !this.showSubitem;
	if (this.showSubitem) {

	} else {
	}
  }
}
