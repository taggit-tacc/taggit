import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FormsService } from 'src/app/services/forms.service';
import { Feature, Project, GroupForm, TagGroup } from 'src/app/models/models';
import { GeoDataService } from 'src/app/services/geo-data.service';
import { ProjectsService } from 'src/app/services/projects.service';

@Component({
  selector: 'app-form-color',
  templateUrl: './form-color.component.html',
  styleUrls: ['./form-color.component.scss'],
})
export class FormColorComponent implements OnInit {
  @Input() field: any = {};
  @Input() form: GroupForm;
  @Input() color: string;
  @Input() label: String;

  public chosenTag: string;
  public activeProject: Project;
  public activeGroup: TagGroup;
  public activeGroupFeature: Feature;
  public chosenColor = '#ffffff';
  value: any = {};

  constructor(
    private formsService: FormsService,
    private projectsService: ProjectsService,
    private geoDataService: GeoDataService
  ) {}

  ngOnInit() {
    this.geoDataService.activeGroupFeature.subscribe((next) => {
      this.value = this.formsService.getTagValue(next, this.form);
      this.chosenTag = this.value.label;
    });

    this.projectsService.activeProject.subscribe((next) => {
      this.activeProject = next;
    });

    this.geoDataService.activeGroup.subscribe((next: TagGroup) => {
      this.activeGroup = next;
    });

    this.geoDataService.activeGroupFeature.subscribe((next) => {
      this.activeGroupFeature = next;
    });
  }

  updateCheckedTag() {
    this.value = this.form.options.find((opt) => opt.label === this.chosenTag);
    this.formsService.saveStyles(
      this.activeProject.id,
      [this.activeGroupFeature],
      this.activeGroup,
      this.value.color
    );

    this.geoDataService.setTagFeaturesQueue(this.activeGroupFeature.id, {
      id: this.form.id,
      value: this.value,
    });
  }
}
