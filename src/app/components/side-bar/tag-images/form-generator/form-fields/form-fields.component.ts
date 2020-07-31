import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-form-fields',
  templateUrl: './form-fields.component.html',
})
export class FormFieldsComponent implements OnInit {
  @Input() field:any;
  @Input() form:any;

  get isValid() { return this.form.controls[this.field.name].valid; }
  get isDirty() { return this.form.controls[this.field.name].dirty; }

  // get isValid() { return true }
  // get isDirty() { return false }


  constructor() { }

  ngOnInit() {
  }

}
