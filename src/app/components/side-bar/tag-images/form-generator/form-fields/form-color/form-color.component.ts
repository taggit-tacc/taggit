import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormsService } from 'src/app/services/forms.service';

@Component({
  selector: 'app-form-color',
  templateUrl: './form-color.component.html',
  styleUrls: ['./form-color.component.scss']
})
export class FormColorComponent implements OnInit {
  @Input() field:any = {};
  @Input() form:FormGroup;
  public chosenTag: string;

  constructor(private formsService: FormsService) { }

  ngOnInit() {
    this.chosenTag = this.formsService.getSelectedRadio(1)
  }

  updateCheckedTag(){ this.formsService.updateSelectedRadio(this.chosenTag, 1); }
}