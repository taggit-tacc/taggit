import {
  Component,
  OnInit,
  TemplateRef,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsService, tags } from '../../../services/forms.service';
import { GroupsService } from '../../../services/groups.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Feature, Project, NewGroup, GroupForm } from 'src/app/models/models';
import { GeoDataService } from 'src/app/services/geo-data.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { FeatureService } from 'src/app/services/feature.service';

@Component({
  selector: 'app-tag-generator',
  templateUrl: './tag-generator.component.html',
  styleUrls: ['./tag-generator.component.scss'],
})
export class TagGeneratorComponent implements OnInit {
  formLabel: string;
  formColor: string;
  formOptions: Array<any> = [];
  selectedGroup: string;
  formType: string;
  changed: boolean = false;
  labelFilter: string;
  optionColorFilter = '#000000';
  formItemList: Array<any> = [];
  activeGroup: NewGroup;
  optionFilter: string;
  formName: string;
  formValue: string;
  formRequired: boolean;
  openOption: any = {};
  enabledControls: Array<string> = [];
  showSubitem: boolean = true;
  activeFormList: Array<any>;
  groups: Map<string, NewGroup>;
  groupsFeatures: Map<string, any>;
  groups$: Subscription;
  tempGroup: Array<Feature>;
  private activeProject: Project;
  newTag: object[] = [];
  newGroup: object[] = [];

  constructor(
    private formsService: FormsService,
    private groupsService: GroupsService,
    private dialog: MatDialog,
    private router: Router,
    private geoDataService: GeoDataService,
    private projectsService: ProjectsService,
    private featureService: FeatureService
  ) {}

  ngOnInit() {
    this.geoDataService.activeGroup.subscribe((next) => {
      this.activeGroup = next;
    });

    this.formsService.activeFormList.subscribe((next) => {
      this.activeFormList = next;
    });

    this.geoDataService.groups.subscribe((next) => {
      this.groups = next;
    });

    this.geoDataService.groupsFeatures.subscribe((next) => {
      this.groupsFeatures = next;
    });

    this.projectsService.activeProject.subscribe((next) => {
      this.activeProject = next;
    });

    this.formOptions = [];
    this.formItemList = [];
    this.formType = 'text';
    this.formName = '';
    this.formLabel = '';
    this.formValue = '';
    this.formRequired = false;
    this.enabledControls = ['Text', 'Checkbox', 'Radio', 'Dropdown', 'Color'];
  }

  inputFormLabel(event: any) {
    this.formLabel = event.target.value;
  }

  inputFormColor(event: any) {
    this.formColor = event.target.value;
    console.log(this.formColor);
  }

  addOptionItem(value: string) {
    if (value) {
      let formWithValue = this.formOptions.filter((e) => e.label == value);
      if (formWithValue.length == 0 && value.length != 0) {
        this.formOptions.push({
          // key: value[0],
          label: value,
          color: this.optionColorFilter,
        });
      }
    }
  }

  deleteOption(opt: any) {
    this.formOptions = this.formOptions.filter(
      (option) => option.label != opt.label
    );
  }

  openRenameModal(template: TemplateRef<any>, name: string) {
    this.selectedGroup = name;
    this.dialog.open(template);
  }

  openRenameOptionModal(template: TemplateRef<any>) {
    this.dialog.open(template);
  }

  renameOption(opt: any, label: string) {
    label = label.toLowerCase();
    this.formOptions.forEach((e) => {
      if (e.label == opt.label) {
        e.label = label;
      }
    });
    console.log(this.formOptions);
  }

  selectInputForm(name: string) {
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

  clearOptionColor() {
    this.optionColorFilter = '#000000';
  }

  addFormItem() {
    //Assemble the new tag
    let formItem: GroupForm = {
      type: this.formType,
      groupName: this.activeGroup.name,
      label: this.formLabel,
      options: [],
    };
    this.openOption[this.formLabel] = false;
    //Adds the options for drop down, checklist, and radio buttons
    if (this.formType !== 'text' && this.formOptions.length != 0) {
      let myOpts = [];
      for (const opt of this.formOptions) {
        myOpts.push({
          // key: opt[0],
          label: opt,
        });
      }
      formItem.options = this.formOptions;
    }
    //Pass it to feature and form service to propogate to all features in a group
    //
    // this.featureService.createTag(formItem, this.activeGroup, this.groupList);
    this.featureService.createForm(
      this.activeProject.id,
      formItem,
      this.groups.get(this.activeGroup.name),
      this.groupsFeatures.get(this.activeGroup.name)
    );
    // this.formsService.saveTag(this.activeGroup, formItem, formItem.label)

    //Reset user-defined fields to blank options
    this.formLabel = '';
    this.formColor = '';
    this.formOptions = [];
    this.labelFilter = '';
    this.changed = true;
    this.groupsService.setShowTagGenerator(false);
  }

  cancelCreate() {
    this.groupsService.setShowTagGenerator(false);
  }

  expandPanel() {
    this.showSubitem = !this.showSubitem;
    if (this.showSubitem) {
    } else {
    }
  }
}
