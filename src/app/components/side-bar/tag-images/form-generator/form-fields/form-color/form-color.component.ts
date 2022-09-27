import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FormsService } from 'src/app/services/forms.service';
import { Feature, Project, GroupForm, TagGroup } from 'src/app/models/models';
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
  public chosenColor = '#ffffff';
  value: any = {};

  constructor(
    private formsService: FormsService,
    private geoDataService: GeoDataService
  ) {}

  ngOnInit() {
    this.geoDataService.activeGroupFeature.subscribe((next) => {
      this.value = this.formsService.getTagValue(next, this.form);
      this.chosenTag = this.value.label;
      this.formValue.emit({ id: this.form.id, value: this.value });
    });
  }

  updateCheckedTag() {
    this.value = this.form.options.find((opt) => opt.label === this.chosenTag);
    // TODO: Move this to somewhere else?
    // Objective is to save both tag and color
    // this.formsService.saveStyles(
    //   this.activeProject.id,
    //   this.value.color,
    //   this.activeGroup,
    //   this.activeGroupFeature
    // );
    this.formValue.emit({ id: this.form.id, value: this.value });
  }
}
