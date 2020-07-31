import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

// text,email,tel,textarea,password,
@Component({
  selector: 'app-form-file',
  templateUrl: './form-file.component.html',
  styleUrls: ['./form-file.component.scss'],
})
export class FormFileComponent {
	@Input() field:any = {};
	@Input() form:FormGroup;
	get isValid() { return this.form.controls[this.field.name].valid; }
	get isDirty() { return this.form.controls[this.field.name].dirty; }

	constructor() {

	}

	ngOnChange(){
	  console.log(this.field.value);
	  // this.field.value.
	}
}
