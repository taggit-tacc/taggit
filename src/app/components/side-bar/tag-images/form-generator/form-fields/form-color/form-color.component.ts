import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FeatureService } from 'src/app/services/feature.service';
import { FormsService } from 'src/app/services/forms.service';
import { GroupsService } from 'src/app/services/groups.service';
import { Feature, Project } from 'src/app/models/models';
import { ProjectsService } from 'src/app/services/projects.service';

@Component({
  selector: 'app-form-color',
  templateUrl: './form-color.component.html',
  styleUrls: ['./form-color.component.scss']
})
export class FormColorComponent implements OnInit {
  @Input() field:any = {};
  @Input() form:FormGroup;
  @Input() color:string;
  @Input() label:String;

  public chosenTag: string;
  public chosenColor = "#ffffff";
  activeGroupFeature: Feature;
  activeProject: Project;

  activeGroup: string;

  constructor(private formsService: FormsService,
    private groupsService: GroupsService,
    private projectsService: ProjectsService,
    private featureService: FeatureService) { }

  ngOnInit() {
    this.groupsService.activeGroupFeature.subscribe((next) => {
      this.activeGroupFeature = next;
    });

    this.groupsService.activeGroup.subscribe((next) => {
      this.activeGroup = next;
    });

    this.projectsService.activeProject.subscribe((next) => {
      this.activeProject = next;
    });

    let index
    this.formsService.getSelectedRadio().forEach(opt=> {
      if(opt != undefined){
        index = opt.findIndex(item => item.id === this.activeGroupFeature.id && item.compID === 1 && item.groupName === this.activeGroup && item.label === this.form['label']);
        if (index > -1){
          this.chosenTag = opt[index].option
        }
      }
      
      this.chosenColor = this.color 
      
    });
  }

  updateCheckedTag(){ 
    this.formsService.saveStyles(this.activeProject.id, this.chosenColor, this.activeGroup, this.activeGroupFeature)
    this.featureService.updateExtra(this.chosenTag, 1, this.activeGroupFeature, this.activeGroup, this.form['label'], "color"); }

}
