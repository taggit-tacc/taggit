import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FormsService } from 'src/app/services/forms.service';
import { Feature, GroupForm, Project, TagGroup } from 'src/app/models/models';
import { GeoDataService } from 'src/app/services/geo-data.service';

@Component({
  selector: 'app-form-textbox',
  templateUrl: './form-textbox.component.html',
})
export class FormTextBoxComponent {
  @Input() field: any = {};
  @Input() form: GroupForm;
  value = '';
  activeGroupFeature: any;

  constructor(
    private formsService: FormsService,
    private geoDataService: GeoDataService
  ) {}

  ngOnInit() {
    this.geoDataService.activeGroupFeature.subscribe((next) => {
      this.activeGroupFeature = next;
      this.value = this.formsService.getTagValue(next, this.form);
    });
  }

  updateValue() {
    this.geoDataService.setFeatureTag(this.activeGroupFeature.id, {
      id: this.form.id,
      value: this.value,
    });
  }
}
