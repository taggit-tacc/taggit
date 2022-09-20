import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FeatureService } from 'src/app/services/feature.service';
import { FormsService } from 'src/app/services/forms.service';
import { GroupsService } from 'src/app/services/groups.service';

// text,email,tel,textarea,password,
@Component({
  selector: 'app-form-textbox',
  templateUrl: './form-textbox.component.html',
})
export class FormTextBoxComponent {
  @Input() field: any = {};
  @Input() form: FormGroup;
  note: string;
  notes = 'notes';
  private activeFeatureId$: Subscription;
  activeFeatureId: number;

  activeGroup: string;
  private activeGroup$: Subscription;

  get isValid() { return this.form.controls[this.field.name].valid; }
  get isDirty() { return this.form.controls[this.field.name].dirty; }

  constructor(private formsService: FormsService,
              private groupsService: GroupsService,
              private featureService: FeatureService) { }

  ngOnInit() {
    this.activeFeatureId$ = this.groupsService.activeFeatureId.subscribe((next) => {
      this.activeFeatureId = next;
    });

    this.activeGroup$ = this.activeGroup$ = this.groupsService.activeGroup.subscribe((next) => {
      this.activeGroup = next;
    });

    let index;
    this.formsService.getSelectedRadio().forEach(opt => {
      // console.log(opt)
      if (opt != undefined) {
        index = opt.findIndex(item => item.id === this.activeFeatureId && item.compID === 3 && item.groupName === this.activeGroup && item.label === this.form.label);
        // console.log(index)
        if (index > -1) {
          // console.log(opt[index].option)
          this.note = opt[index].option;
        }
      }
      
      
    });

    // const index = this.formsService.getNotes().findIndex(item => item.id === this.activeFeatureId);
    // if (index > -1){
    //   this.note = this.formsService.getNotes()[index]['option']
    // }
  }

  updateNotes() { 
    // console.log(this.form['label'])
    // console.log(this.form.name)
    this.featureService.updateExtra(this.note, 3, this.activeFeatureId, this.activeGroup, this.form.label, 'text'); }
}
