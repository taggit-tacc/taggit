import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FeatureService } from 'src/app/services/feature.service';
import { FormsService } from 'src/app/services/forms.service';
import { GroupsService } from 'src/app/services/groups.service';
import { Feature } from 'src/app/models/models';

@Component({
  selector: 'app-form-checkbox',
  templateUrl: 'form-checkbox.component.html',
})
export class FormCheckBoxComponent {
  @Input() field: any;
  @Input() form: FormGroup;
  isChecked: boolean = false;
  activeGroupFeature: Feature;
  activeGroup: string;
  // get isValid() { return this.form.controls[this.field.name].valid; }
  // get isDirty() { return this.form.controls[this.field.name].dirty; }

  constructor(
    private formsService: FormsService,
    private groupsService: GroupsService,
    private featureService: FeatureService
  ) {}

  checkedOpt: any[] = this.formsService.getCheckedOpt();

  ngOnInit() {
    this.groupsService.activeGroupFeature.subscribe((next) => {
      this.activeGroupFeature = next;
    });

    this.groupsService.activeGroup.subscribe((next) => {
      this.activeGroup = next;
    });
    // this code checks if the option has been checked or not
    if (this.formsService.getCheckedOpt().length != 0) {
      let index;
      this.checkedOpt.forEach((opt) => {
        if (opt != undefined) {
          index = opt.findIndex(
            (item) =>
              item.id === this.activeGroupFeature.id &&
              item.option === this.field.label &&
              item.group === this.activeGroup &&
              item.label === this.form['label']
          );

          if (index > -1) {
            this.isChecked = true;
          }
        }
      });
      // const index = this.checkedOpt.findIndex(item => item.id === this.activeFeatureId && item.label === this.field.label );
    }
  }

  // adds/deletes to/from the list of checked options
  selected(e: any, option: object) {
    if (e.target.checked) {
      console.log('Checked');
      this.featureService.updateChecked(
        option,
        this.activeGroupFeature,
        this.activeGroup,
        this.form['label'],
        'create'
      );
    } else {
      console.log('Unchecked');
      this.featureService.updateChecked(
        option,
        this.activeGroupFeature,
        this.activeGroup,
        this.form['label'],
        'delete'
      );
    }
  }
}
