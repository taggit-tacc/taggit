import { Component, OnInit } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-foundation';
import { FormGroup, FormControl } from '@angular/forms';
import { ProjectsService } from '../../services/projects.service';
import { Project, ProjectRequest } from '../../models/models';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-modal-create-project',
  templateUrl: './modal-create-project.component.html',
  styleUrls: ['./modal-create-project.component.scss']
})
export class ModalCreateProjectComponent implements OnInit {

  public readonly onClose: Subject<any> = new Subject<any>();

  projCreateForm: FormGroup;

  constructor(public dialogRef: MatDialogRef<ModalCreateProjectComponent>,
			  private dialog: MatDialog,
			  private projectsService: ProjectsService) { }

  ngOnInit() {
	this.projCreateForm = new FormGroup( {
	  name: new FormControl(''),
	  description: new FormControl('')
	});
  }

  close(project: Project) {
	this.dialogRef.close();
  }

  submit() {
	//Watch content we can set to false, for our project, we don't need this yet.
	//Watch content refers to syncing files created in a folder with a hazmapper map
	//Set observable to true, Hazmapper doesn't let users define that value for some reason.
	const proj = new Project();
	const projRqst = new ProjectRequest();

	//Retrieve project name and description
	proj.description = this.projCreateForm.get('description').value;
	proj.name = this.projCreateForm.get('name').value;

	projRqst.project = proj

	this.projectsService.create(projRqst)
	this.dialogRef.close();
  }

}
