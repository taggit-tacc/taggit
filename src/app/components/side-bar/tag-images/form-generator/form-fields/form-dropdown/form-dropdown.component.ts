import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-form-dropdown',
  templateUrl: './form-dropdown.component.html',
})

export class FormDropDownComponent {
  @Input() field:any = {};
  @Input() form:FormGroup;

  constructor() {

  }
}
