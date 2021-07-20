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
  chosenTag:string;

  constructor(private formsService: FormsService) { }

  //The problem is that I don't actually know the shape of the data here, I've never actually looked at the dropdown box, so I don't know how
  //it operates. Is it one value? A list of values? How should I access them? What should be accessed? 
  ngOnInit() {
    this.chosenTag = this.formsService.getSelectedRadio(2)
    console.log(this.chosenTag)
  }

  updateCheckedTag(){ console.log(this.chosenTag); this.formsService.updateSelectedRadio(this.chosenTag, 2);}
}
