import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FormsService } from 'src/app/services/forms.service';
import { GroupsService } from 'src/app/services/groups.service';

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
  private activeFeatureId$: Subscription;
  activeFeatureId: number;


  constructor(private formsService: FormsService,
    private groupsService: GroupsService) { }

  ngOnInit() {
    this.activeFeatureId$ = this.groupsService.activeFeatureId.subscribe((next) => {
      this.activeFeatureId = next;
    });
    const index = this.formsService.getSelectedRadio().findIndex(item => item.id === this.activeFeatureId && item.compId === 1);
    if (index > -1){
      this.chosenTag = this.formsService.getSelectedRadio()[index]['option']
    }
    this.chosenColor = this.color  
  }

  updateCheckedTag(){ 
    this.formsService.saveStyles(this.chosenColor)
    this.formsService.updateSelectedRadio(this.chosenTag, 1, this.activeFeatureId); }

}