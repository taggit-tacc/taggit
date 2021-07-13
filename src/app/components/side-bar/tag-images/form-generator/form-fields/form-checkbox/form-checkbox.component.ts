import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormsService } from 'src/app/services/forms.service';

@Component({
  selector: 'app-form-checkbox',
  templateUrl: 'form-checkbox.component.html'
})
export class FormCheckBoxComponent {
  @Input() field:any;
  @Input() form:FormGroup;
  isChecked: boolean = false;
  // get isValid() { return this.form.controls[this.field.name].valid; }
  // get isDirty() { return this.form.controls[this.field.name].dirty; }

  constructor(private formsService: FormsService) { }

  checkedOpt: object [] = this.formsService.getCheckedOpt()

  ngOnInit() {

    console.log(this.field)
    console.log(this.form)

  
    // this code checks if the option has been checked or not
    if(this.formsService.getCheckedOpt().length != 0){
      console.log("GOT HERE")
      const index = this.formsService.getCheckedOpt().findIndex(item => item === this.field);
      if (index > -1){
        this.isChecked = true
      }
    }

    console.log("GOT HERE")
  }

  // adds/deletes to/from the list of checked options
  selected(e:any, option:object){
    if(e.target.checked){
      console.log("Checked")
      this.formsService.addCheckedOpt(option);

    }else{
      console.log("Unchecked")
      this.formsService.deleteCheckedOpt(option);
    }
  }
}
