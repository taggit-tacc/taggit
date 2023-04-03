import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FormsService } from 'src/app/services/forms.service';
import { GroupsService } from 'src/app/services/groups.service';
import { Feature, GroupForm } from 'src/app/models/models';
import { GeoDataService } from 'src/app/services/geo-data.service';

@Component({
  selector: 'app-form-dropdown',
  templateUrl: './form-dropdown.component.html',
})
export class FormDropDownComponent {
  @Input() field: any = {};
  @Input() form: GroupForm;
  value: string;
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
    this.geoDataService.setTagFeaturesQueue(this.activeGroupFeature.id, {
      id: this.form.id,
      value: this.value,
    });
  }
}
