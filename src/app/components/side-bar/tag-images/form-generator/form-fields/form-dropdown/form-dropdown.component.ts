import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormsService } from 'src/app/services/forms.service';

@Component({
  selector: 'app-form-dropdown',
  templateUrl: './form-dropdown.component.html',
})

export class FormDropDownComponent {
  @Input() field:any = {};
  @Input() form:FormGroup;

  constructor(private formsService: FormsService) { }

  ngOnInit() {
    
  }

  update(){  }
}
