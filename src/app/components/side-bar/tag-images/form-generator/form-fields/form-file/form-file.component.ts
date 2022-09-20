import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { GroupForm } from 'src/app/models/models';

@Component({
  selector: 'app-form-file',
  templateUrl: './form-file.component.html',
  styleUrls: ['./form-file.component.scss'],
})
export class FormFileComponent {
  field: any = {};
  form: GroupForm;

  constructor() {}

  ngOnChange() {
    console.log(this.field.value);
  }
}
