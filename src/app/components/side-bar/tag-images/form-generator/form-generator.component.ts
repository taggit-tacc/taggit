import { Component, Input, OnInit, OnDestroy, OnChanges, Output, EventEmitter } from '@angular/core';
import { FormsService } from '../../../../services/forms.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { consoleTestResultHandler } from 'tslint/lib/test';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';

@Component({
  selector: 'app-form-generator',
  templateUrl: './form-generator.component.html',
  styleUrls: ['./form-generator.component.scss']
})

export class FormGeneratorComponent implements OnInit, OnDestroy {
  @Input() field: any;
  private formGroup$: Subscription;
  form: FormGroup;
  checked: boolean = false;
  checkedOpt: object [] = this.formsService.getCheckedOpt();
  colorArray: Array<string> = []

  constructor(private formsService: FormsService) { }

  ngOnInit() {

	this.formGroup$ = this.formsService.formGroup.subscribe((next) => {
	  this.form = next;
	});

  // console.log(this.formsService.getCheckedOpt())
  // this.formsService.addCheckedOpt(this.field.options[0]);

  // this.field.options.forEach(function (value) {
    
  // console.log("GOT HERE")
  //   if(this.formsService.getCheckedOpt().length != 0){
  //     console.log("GOT HERE")
  //     const index = this.formsService.getCheckedOpt().findIndex(item => item === value);
  //     if (index > -1){
  //       this.checked = true
  //     }
  //   }});

  //   console.log("GOT HERE")
  
    this.generateColors()
  }

  //Generates a key:value list of colors ranging from green (#00FF00) to red (#FF0000) based on passed in info
  generateColors(){
    let itemCount = this.field.options.length
    let isOdd = false
    if( itemCount % 2 === 1 ) {
      //if there are an odd number of items in the collection, mark it and decriment the counter
      isOdd = true
      itemCount --
    }
    //Subtract 2 from item count (first entry is always green, #00FF00, last entry is always red, #FF0000
    //Then half the item count, and use it to divide 255, this gives the amount we have to increment the colors
    itemCount = (itemCount - 2)/2
    let incrementVal = Math.floor(255/itemCount)
    if (incrementVal === 255) { incrementVal = Math.floor(incrementVal/2) }
    this.colorArray.push("#00FF00")
    let baseNum = 0
    let temp
    //First loop, counts up from zero towards 255
    for (let index = 0; index < itemCount; index++) {
      baseNum = baseNum + incrementVal
      temp = baseNum.toString(16)
      this.colorArray.push(`#${temp}FF00`)
    }
    //if there is an odd number of selections, push full yellow as a midpoint in the gradient
    if( isOdd ) { this.colorArray.push("#FFFF00"); }
    baseNum = 255 //Resets baseNum to 255 for the count down
    //Second loop, counts down from 255 towards zero
    for (let index = 0; index < itemCount; index++) {
      baseNum = baseNum - incrementVal
      temp = baseNum.toString(16)
      if (temp.length != 2) { temp = "0" + temp; }
      this.colorArray.push(`#FF${temp}00`)
    }
    //Finally, pushes the color code for red onto the stack for the last entry
    this.colorArray.push('#FF0000')
  }

// export class FormGeneratorComponent implements OnInit, OnChanges {
  name = new FormControl('');

  // get isValid() { return this.form.controls[this.field.label].valid; }

  ngOnDestroy() {
	this.formGroup$.unsubscribe();
  }

  selected(e:any, option:object){
    if(e){
      console.log("Checked")
      console.log(option)
      this.formsService.addCheckedOpt(option);
      // console.log(this.checkedOpt)
    }else{
      console.log("Unchecked")
      this.formsService.deleteCheckedOpt(option);
      // console.log(this.checkedOpt)
    }
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
