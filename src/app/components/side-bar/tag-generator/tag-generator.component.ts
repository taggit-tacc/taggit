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
import { Feature, Project, TagGroup, GroupForm } from 'src/app/models/models';
import { GeoDataService } from 'src/app/services/geo-data.service';
import { ProjectsService } from 'src/app/services/projects.service';

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
  labelFilter: string;
  optionColorFilter = '#000000';
  activeGroup: TagGroup;
  optionFilter: string;
  formName: string;
  formValue: string;
  formRequired: boolean;
  openOption: any = {};
  enabledControls: Array<string> = [];
  showSubitem = true;
  groups: Map<string, TagGroup>;
  groupsFeatures: Map<string, any>;
  groups$: Subscription;
  private activeProject: Project;

  constructor(
    private formsService: FormsService,
    private groupsService: GroupsService,
    private dialog: MatDialog,
    private router: Router,
    private geoDataService: GeoDataService,
    private projectsService: ProjectsService
  ) {}

  ngOnInit() {
    this.geoDataService.activeGroup.subscribe((next) => {
      this.activeGroup = next;
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
  }

  addOptionItem(value: string) {
    if (value) {
      const formWithValue = this.formOptions.filter((e) => e.label == value);
      if (formWithValue.length == 0 && value.length != 0) {
        this.formOptions.push({
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

  clear() {
    this.clearLabel();
    this.clearOptionColor();
    this.clearOption();
  }

  addFormItem() {
    // Assemble the new tag
    const formItem: GroupForm = {
      type: this.formType,
      groupName: this.activeGroup.name,
      label: this.formLabel,
      options: [],
    };
    this.openOption[this.formLabel] = false;
    // Adds the options for drop down, checklist, and radio buttons
    if (this.formType !== 'text' && this.formOptions.length != 0) {
      const myOpts = [];
      for (const opt of this.formOptions) {
        myOpts.push({
          label: opt,
        });
      }
      formItem.options = this.formOptions;
    }

    this.formsService.createForm(
      this.activeProject.id,
      formItem,
      this.groups.get(this.activeGroup.name),
      this.groupsFeatures.get(this.activeGroup.name)
    );

    // Reset user-defined fields to blank options
    this.formLabel = '';
    this.formColor = '';
    this.formOptions = [];
    this.groupsService.setShowTagGenerator(false);
    this.clear();
  }

  cancelCreate() {
    this.groupsService.setShowTagGenerator(false);
    this.clear();
  }

  expandPanel() {
    this.showSubitem = !this.showSubitem;
  }
}
