import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FeatureService } from 'src/app/services/feature.service';
import { FormsService } from 'src/app/services/forms.service';
import { GroupsService } from 'src/app/services/groups.service';
import { Feature } from 'src/app/models/models';

@Component({
  selector: 'app-form-radio',
  templateUrl: './form-radio.component.html',
})
export class FormRadioComponent {
  @Input() field: any = {};
  @Input() form: FormGroup;
  @Input() label: String;
  public chosenTag: string;
  activeGroupFeature: Feature;

  activeGroup: string;

  constructor(
    private formsService: FormsService,
    private groupsService: GroupsService,
    private featureService: FeatureService
  ) {}

  ngOnInit() {
    this.groupsService.activeGroupFeature.subscribe((next) => {
      this.activeGroupFeature = next;
    });

    this.groupsService.activeGroup.subscribe((next) => {
      this.activeGroup = next;
    });

    let index;
    this.formsService.getSelectedRadio().forEach((opt) => {
      if (opt != undefined) {
        index = opt.findIndex(
          (item) =>
            item.id === this.activeGroupFeature.id &&
            item.compID == 0 &&
            item.groupName === this.activeGroup &&
            item.label === this.form['label']
        );
        if (index > -1) {
          this.chosenTag = opt[index].option;
        }
      }
    });
    // if(this.formsService.getSelectedRadio(0)['id'] === this.activeFeatureId){
    // const index = this.formsService.getSelectedRadio().findIndex(item => item.id === this.activeFeatureId && item.compId === 0);
    // console.log(index)
    // if (index > -1){
    //   this.chosenTag = this.formsService.getSelectedRadio()[index]['option']
    // }
    // }
  }

  updateCheckedTag() {
    this.featureService.updateExtra(
      this.chosenTag,
      0,
      this.activeGroupFeature,
      this.activeGroup,
      this.form['label'],
      'radio'
    );
  }
}
