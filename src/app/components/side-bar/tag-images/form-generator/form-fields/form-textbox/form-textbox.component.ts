import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormsService } from 'src/app/services/forms.service';

// text,email,tel,textarea,password,
@Component({
  selector: 'app-form-textbox',
  templateUrl: './form-textbox.component.html',
})
export class FormTextBoxComponent {
  @Input() field:any = {};
  @Input() form:FormGroup;
  note:string;

  get isValid() { return this.form.controls[this.field.name].valid; }
  get isDirty() { return this.form.controls[this.field.name].dirty; }

  constructor(private formsService: FormsService) { }

  ngOnInit() {
    this.note = this.formsService.getNotes()
  }

  updateNotes(){ this.formsService.updateNotes(this.note); }
}
