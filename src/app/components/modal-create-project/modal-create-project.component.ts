import { Component, OnInit } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-foundation';
import { FormGroup, FormControl } from '@angular/forms';
import { ProjectsService } from '../../services/projects.service';
import { Project } from '../../models/models';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-create-project',
  templateUrl: './modal-create-project.component.html',
  styleUrls: ['./modal-create-project.component.scss']
})
export class ModalCreateProjectComponent implements OnInit {

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

  close() {
	this.dialogRef.close();
  }

  submit() {
	const p = new Project();
	p.description = this.projCreateForm.get('description').value;
	p.name = this.projCreateForm.get('name').value;
	this.projectsService.create(p);
	this.dialogRef.close();
  }

}
