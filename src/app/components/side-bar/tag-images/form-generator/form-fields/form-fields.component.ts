import { Component, Input, OnInit } from '@angular/core';
import { GroupForm } from 'src/app/models/models';

@Component({
  selector: 'app-form-fields',
  templateUrl: './form-fields.component.html',
})
export class FormFieldsComponent implements OnInit {
  field: any;
  form: GroupForm;

  constructor() {}

  // This file and the HTML connected to this is useless so don't worry about it
  ngOnInit() {}
}
