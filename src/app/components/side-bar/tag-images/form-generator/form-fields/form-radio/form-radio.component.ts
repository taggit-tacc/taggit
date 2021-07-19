import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormsService } from 'src/app/services/forms.service';

@Component({
  selector: 'app-form-radio',
  templateUrl: './form-radio.component.html',
})
export class FormRadioComponent {
  @Input() field:any = {};
  @Input() form:FormGroup;
  public chosenTag: string;

  constructor(private formsService: FormsService) { }

  ngOnInit() {
    this.chosenTag = this.formsService.getSelectedRadio(0)
  }

  updateCheckedTag(){ this.formsService.updateSelectedRadio(this.chosenTag, 0); }
}