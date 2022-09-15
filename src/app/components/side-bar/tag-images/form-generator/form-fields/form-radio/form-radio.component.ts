import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FeatureService } from 'src/app/services/feature.service';
import { FormsService } from 'src/app/services/forms.service';
import { GroupsService } from 'src/app/services/groups.service';
import { Feature, GroupForm, Project, NewGroup } from 'src/app/models/models';
import { ProjectsService } from 'src/app/services/projects.service';
import { GeoDataService } from 'src/app/services/geo-data.service';

@Component({
  selector: 'app-form-radio',
  templateUrl: './form-radio.component.html',
})
export class FormRadioComponent {
  @Output() formValue: EventEmitter<any> = new EventEmitter<any>();
  @Input() field: any = {};
  @Input() form: GroupForm;
  @Input() label: String;
  public value: string;
  activeGroupFeature: Feature;
  activeProject: Project;
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
    this.formValue.emit({id: this.form.id, value: this.value});
  }
}
