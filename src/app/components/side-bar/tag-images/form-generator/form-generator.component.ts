import { Component, Input, OnInit, OnDestroy, OnChanges, Output, EventEmitter } from '@angular/core';
import { FormsService } from '../../../../services/forms.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-form-generator',
  templateUrl: './form-generator.component.html',
  styleUrls: ['./form-generator.component.scss']
})

export class FormGeneratorComponent implements OnInit, OnDestroy {
  @Input() field: any;
  private formGroup$: Subscription;
  form: FormGroup;


  constructor(private formsService: FormsService) { }

  ngOnInit() {

	this.formGroup$ = this.formsService.formGroup.subscribe((next) => {
	  this.form = next;
	});

  }

// export class FormGeneratorComponent implements OnInit, OnChanges {
  name = new FormControl('');

  get isValid() { return this.form.controls[this.field.label].valid; }

  ngOnDestroy() {
	this.formGroup$.unsubscribe();
  }
  // @Output() onSubmit = new EventEmitter();
  // @Input() fields: any[] = [];
  // form: FormGroup;

  // ngOnInit() {
  //	this.generateFields();
  //	// let fieldsCtrls = {};
  //	// for (let f of this.fields) {
  //	//   if (f.type != 'checkbox') {
  //	// fieldsCtrls[f.name] = new FormControl(f.value || '', Validators.required)
  //	//   } else {
  //	// let opts = {};
  //	// for (let opt of f.options) {
  //	//   opts[opt.key] = new FormControl(opt.value);
  //	// }
  //	// fieldsCtrls[f.name] = new FormGroup(opts)
  //	//   }
  //	// }
  //	// this.form = new FormGroup(fieldsCtrls);
  // }

  // // Combine this with
  // ngOnChanges() {
  //	this.generateFields();
  // }

  // generateFields() {
  //	let fieldsCtrls = {};

  //	for (let f of this.fields) {
  //	  // if (f.type != 'checkbox') {
  //		fieldsCtrls[f.name] = new FormControl(f.value || '', Validators.required)
  //	  // } else {
  //		// let opts = {};
  //		// for (let opt of f.options) {
  //		//   opts[opt.key] = new FormControl(opt.value);
  //		// }
  //		// fieldsCtrls[f.name] = new FormGroup(opts)
  //	  // }
  //	}

  //	this.form = new FormGroup(fieldsCtrls);
  // }
}
