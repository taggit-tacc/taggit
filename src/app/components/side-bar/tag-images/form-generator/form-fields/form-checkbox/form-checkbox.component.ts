import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { FeatureService } from 'src/app/services/feature.service';
import { FormsService } from 'src/app/services/forms.service';
import { GroupsService } from 'src/app/services/groups.service';
import { Feature, GroupForm, Project, TagGroup } from 'src/app/models/models';
import { ProjectsService } from 'src/app/services/projects.service';
import { GeoDataService } from 'src/app/services/geo-data.service';

@Component({
  selector: 'app-form-checkbox',
  templateUrl: 'form-checkbox.component.html',
})
export class FormCheckBoxComponent {
  @Input() field: any;
  @Input() form: GroupForm;
  value: any[] = [];
  activeGroupFeature: Feature;
  activeGroup: TagGroup;
  private activeProject: Project;

  constructor(
    private formsService: FormsService,
    private groupsService: GroupsService,
    private geoDataService: GeoDataService,
    private projectsService: ProjectsService,
    private featureService: FeatureService
  ) {}

  ngOnInit() {
    this.geoDataService.activeGroupFeature.subscribe((next) => {
      this.activeGroupFeature = next;
      this.value = this.formsService.getTagValue(next, this.form);
    });

    this.geoDataService.activeGroup.subscribe((next) => {
      this.activeGroup = next;
    });

    this.projectsService.activeProject.subscribe((next) => {
      this.activeProject = next;
    });
  }

  isChecked(opt) {
    return this.value.some((val) => val.label === opt.label);
  }

  selected(e: any, option: any) {
    this.value = this.value.filter((opt) => opt.label !== option.label);
    if (e.target.checked) {
      this.value.push(option);
    }
    this.geoDataService.setTagFeaturesQueue(this.activeGroupFeature.id, {
      id: this.form.id,
      value: this.value,
    });
  }
}
