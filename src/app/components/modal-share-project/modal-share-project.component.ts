import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormControl } from '@angular/forms';
import { ProjectsService } from '../../services/projects.service';
import { Project } from '../../models/models';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-modal-share-project',
  templateUrl: './modal-share-project.component.html',
  styleUrls: ['./modal-share-project.component.scss']
})
export class ModalShareProjectComponent implements OnInit {

  projShareForm: FormGroup;
  activeProj: Project;
  projectUsers;
  onlyOne: boolean; // if only one user is present == TRUE 

  constructor(public dialogRef: MatDialogRef<ModalShareProjectComponent>,
              private dialog: MatDialog,
              private projectsService: ProjectsService) { }

  ngOnInit() {
    // creates new form control group to access input value
    this.projShareForm = new FormGroup({
      name: new FormControl(''),
    });

    // retrieves active project, needed to add users to the project
    this.projectsService.activeProject.subscribe((proj) => {
      this.activeProj = proj;
    });

    // retrieves all users currently registered to the active project
    this.projectsService.getProjectUsers(this.activeProj).subscribe((next) => {
      this.projectUsers = next;
      this.onlyOne = (this.projectUsers.length == 1);
      console.log(this.onlyOne);
    });
  }

  // closes modal without submitting anything
  close() {
    this.dialogRef.close();
    }

  // shares project with specified user
  submit() {
    this.projectsService.addUserToProject(this.activeProj, this.projShareForm.get('name').value);
    this.dialogRef.close();
  }

  // deletes user from project
  delete(user) {
    this.projectsService.deleteUserFromProject(this.activeProj, user);
    this.dialogRef.close();
  }

}
