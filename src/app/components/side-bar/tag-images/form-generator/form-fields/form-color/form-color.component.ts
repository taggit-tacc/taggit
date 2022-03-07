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

  activeGroup: string;
  private activeGroup$: Subscription;

  constructor(private formsService: FormsService,
    private groupsService: GroupsService) { }

  ngOnInit() {
    this.activeFeatureId$ = this.groupsService.activeFeatureId.subscribe((next) => {
      this.activeFeatureId = next;
    });

    this.activeGroup$ = this.activeGroup$ = this.groupsService.activeGroup.subscribe((next) => {
      this.activeGroup = next;
    });

    let index
    this.formsService.getSelectedRadio().forEach(opt=> {
      if(opt != undefined){
        index = opt.findIndex(item => item.id === this.activeFeatureId && item.compId === 1 && item.groupName === this.activeGroup && item.label === this.form['label']);
        if (index > -1){
          this.chosenTag = opt[index].option
        }
      }
      
      this.chosenColor = this.color 
      
    });
  }

  updateCheckedTag(){ 
    this.formsService.saveStyles(this.chosenColor, this.activeFeatureId)
    this.formsService.updateSelectedRadio(this.chosenTag, 1, this.activeFeatureId, this.activeGroup, this.form['label']); }

}