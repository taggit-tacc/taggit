import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FeatureService } from 'src/app/services/feature.service';
import { FormsService } from 'src/app/services/forms.service';
import { GroupsService } from 'src/app/services/groups.service';
import { Feature, Project, GroupForm, NewGroup } from 'src/app/models/models';
import { ProjectsService } from 'src/app/services/projects.service';
import { GeoDataService } from 'src/app/services/geo-data.service';

@Component({
  selector: 'app-form-color',
  templateUrl: './form-color.component.html',
  styleUrls: ['./form-color.component.scss'],
})
export class FormColorComponent implements OnInit {
  @Output() formValue: EventEmitter<any> = new EventEmitter<any>();
  @Input() field: any = {};
  @Input() form: GroupForm;
  @Input() color: string;
  @Input() label: String;

  public chosenTag: string;
  public chosenColor = "#ffffff";
  activeGroupFeature: Feature;
  activeProject: Project;
  value: any = {};

  activeGroup: NewGroup;

  constructor(
    private formsService: FormsService,
    private groupsService: GroupsService,
    private projectsService: ProjectsService,
    private geoDataService: GeoDataService,
    private featureService: FeatureService
  ) {}

  ngOnInit() {
    this.geoDataService.activeGroupFeature.subscribe((next) => {
      this.activeGroupFeature = next;
      this.value = this.formsService.getTagValue(next, this.form);
      this.chosenTag = this.value.label;
      this.formValue.emit({id: this.form.id, value: this.value});
    });

    this.geoDataService.activeGroup.subscribe((next) => {
      this.activeGroup = next;
    });

    this.projectsService.activeProject.subscribe((next) => {
      this.activeProject = next;
    });
  }

  updateCheckedTag() {
    this.value = this.form.options.find(opt => opt.label === this.chosenTag);
    console.log(this.value)
    // TODO: Move this to somewhere else?
    // Objective is to save both tag and color
    // this.formsService.saveStyles(
    //   this.activeProject.id,
    //   this.value.color,
    //   this.activeGroup,
    //   this.activeGroupFeature
    // );
    this.formValue.emit({id: this.form.id, value: this.value});
  }
}
