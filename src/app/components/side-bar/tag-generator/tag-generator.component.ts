import { Component, OnInit, TemplateRef, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsService, tags } from '../../../services/forms.service';
import { GroupsService } from '../../../services/groups.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Feature, Project } from 'src/app/models/models';
import { GeoDataService } from 'src/app/services/geo-data.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { FeatureService } from 'src/app/services/feature.service';


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
  newTag: object[] = [];
  newGroup:object[] = [];

  constructor(
	private formsService: FormsService,
	private groupsService: GroupsService,
	private dialog: MatDialog,
	private router: Router,
	private geoDataService: GeoDataService,
	private projectsService: ProjectsService,
	private featureService: FeatureService) { }

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

	// Set up the new tag information
	let formItem: tags = {
		type: this.formType,
		groupName: this.formName,
		label: this.formLabel,
		// value: this.formValue,
		// required: this.formRequired,
		options: [],
		feature: 0,
		extra: []
	}
	this.openOption[this.formLabel] = false;

	// If the tag has options, fill that in the tag
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

	  // Update the feature list with the new tag
	  this.featureService.createTag(this.groupList, this.activeGroup, formItem)

	  this.formLabel = '';
	  this.formOptions = [];
	  this.labelFilter = '';
	  this.changed = true;
	  
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
