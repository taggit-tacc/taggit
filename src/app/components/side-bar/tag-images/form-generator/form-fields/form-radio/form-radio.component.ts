import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsService } from 'src/app/services/forms.service';
import { GroupForm } from 'src/app/models/models';
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

  constructor(
    private formsService: FormsService,
    private geoDataService: GeoDataService,
  ) {}

  ngOnInit() {
    this.geoDataService.activeGroupFeature.subscribe((next) => {
      this.value = this.formsService.getTagValue(next, this.form);
      this.formValue.emit({id: this.form.id, value: this.value});
    });
  }

  updateCheckedTag() {
    this.formValue.emit({id: this.form.id, value: this.value});
  }
}
