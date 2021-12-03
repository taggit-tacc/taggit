import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FormsService } from 'src/app/services/forms.service';
import { GroupsService } from 'src/app/services/groups.service';

@Component({
  selector: 'app-form-dropdown',
  templateUrl: './form-dropdown.component.html',
})

export class FormDropDownComponent {
  @Input() field:any = {};
  @Input() form:FormGroup;
  chosenTag:string;
  private activeFeatureId$: Subscription;
  activeFeatureId: number;

  activeGroup: string;
  private activeGroup$: Subscription;

  constructor(private formsService: FormsService,
    private groupsService: GroupsService) { }

  //The problem is that I don't actually know the shape of the data here, I've never actually looked at the dropdown box, so I don't know how
  //it operates. Is it one value? A list of values? How should I access them? What should be accessed? 
  ngOnInit() {
    this.activeFeatureId$ = this.groupsService.activeFeatureId.subscribe((next) => {
      this.activeFeatureId = next;
    });

    this.activeGroup$ = this.activeGroup$ = this.groupsService.activeGroup.subscribe((next) => {
      this.activeGroup = next;
    });

    let index
    this.formsService.getSelectedRadio().forEach(opt=> {
      // console.log(opt)
      if(opt != undefined){
        index = opt.findIndex(item => item.id === this.activeFeatureId && item.compId === 2 && item.groupName === this.activeGroup && item.label === this.form['label']);
        // console.log(index)
        if (index > -1){
          // console.log(opt[index].option)
          this.chosenTag = opt[index].option
        }}
      
      
    });

    // const index = this.formsService.getSelectedRadio().findIndex(item => item.id === this.activeFeatureId && item.compId === 2);
    // if (index > -1){
    //   this.chosenTag = this.formsService.getSelectedRadio()[index]['option']
    // }
    
    // console.log(this.chosenTag)
  }

  updateCheckedTag(){ this.formsService.updateSelectedRadio(this.chosenTag, 2, this.activeFeatureId, this.activeGroup, this.form['label']);}
}
