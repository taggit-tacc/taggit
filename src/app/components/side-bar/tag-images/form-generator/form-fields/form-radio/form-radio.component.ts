import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsService } from 'src/app/services/forms.service';
import { GroupForm } from 'src/app/models/models';
import { GeoDataService } from 'src/app/services/geo-data.service';

@Component({
  selector: 'app-form-radio',
  templateUrl: './form-radio.component.html',
})
export class FormRadioComponent {
  @Input() field: any = {};
  @Input() form: GroupForm;
  @Input() label: String;
  public value: string;
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

  updateCheckedTag() {
    this.geoDataService.setFeatureTag(this.activeGroupFeature.id, {
      id: this.form.id,
      value: this.value,
    });
  }
}
