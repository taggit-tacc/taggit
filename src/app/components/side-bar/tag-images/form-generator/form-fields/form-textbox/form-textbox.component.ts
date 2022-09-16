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
  @Output() formValue: EventEmitter<any> = new EventEmitter<any>();
  @Input() field: any = {};
  @Input() form: GroupForm;
  value: string = '';

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

  updateValue() {
    this.formValue.emit({id: this.form.id, value: this.value});
  }
}
