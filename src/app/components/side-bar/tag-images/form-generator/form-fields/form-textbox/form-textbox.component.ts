import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FormsService } from 'src/app/services/forms.service';
import { GroupsService } from 'src/app/services/groups.service';

// text,email,tel,textarea,password,
@Component({
  selector: 'app-form-textbox',
  templateUrl: './form-textbox.component.html',
})
export class FormTextBoxComponent {
  @Input() field:any = {};
  @Input() form:FormGroup;
  note:string;
  notes:string = "notes";
  private activeFeatureId$: Subscription;
  activeFeatureId: number;

  get isValid() { return this.form.controls[this.field.name].valid; }
  get isDirty() { return this.form.controls[this.field.name].dirty; }

  constructor(private formsService: FormsService,
    private groupsService: GroupsService) { }

  ngOnInit() {
    this.activeFeatureId$ = this.groupsService.activeFeatureId.subscribe((next) => {
      this.activeFeatureId = next;
    });
    const index = this.formsService.getNotes().findIndex(item => item.id === this.activeFeatureId);
    if (index > -1){
      this.note = this.formsService.getNotes()[index]['option']
    }
  }

  updateNotes(){ this.formsService.updateNotes(this.note, this.activeFeatureId); }
}
