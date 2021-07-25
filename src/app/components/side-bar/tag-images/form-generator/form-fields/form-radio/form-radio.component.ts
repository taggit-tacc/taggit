import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FormsService } from 'src/app/services/forms.service';
import { GroupsService } from 'src/app/services/groups.service';

@Component({
  selector: 'app-form-radio',
  templateUrl: './form-radio.component.html',
})
export class FormRadioComponent {
  @Input() field:any = {};
  @Input() form:FormGroup;
  public chosenTag: string;
  private activeFeatureId$: Subscription;
  activeFeatureId: number;

  constructor(private formsService: FormsService,
    private groupsService: GroupsService) { }

  ngOnInit() {
    this.activeFeatureId$ = this.groupsService.activeFeatureId.subscribe((next) => {
      this.activeFeatureId = next;
    });

    console.log(this.formsService.getSelectedRadio() )
    // if(this.formsService.getSelectedRadio(0)['id'] === this.activeFeatureId){
    const index = this.formsService.getSelectedRadio().findIndex(item => item.id === this.activeFeatureId && item.compId === 0);
    console.log(index)
    if (index > -1){
      this.chosenTag = this.formsService.getSelectedRadio()[index]['option']
    }
  // }
  }

  updateCheckedTag(){ this.formsService.updateSelectedRadio(this.chosenTag, 0, this.activeFeatureId);}
}