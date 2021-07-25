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
  @Input() color:string;

  public chosenTag: string;
  public chosenColor = "#ffffff";

  constructor(private formsService: FormsService) { }

  ngOnInit() {
    this.chosenTag = this.formsService.getSelectedRadio(1)
    this.chosenColor = this.color
  }

  updateCheckedTag(){ 
    this.formsService.saveStyes(this.chosenColor)
    this.formsService.updateSelectedRadio(this.chosenTag, 1); 
  }
}