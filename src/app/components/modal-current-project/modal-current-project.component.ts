import { Component, OnInit, Inject } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-foundation';
import { FormGroup, FormControl } from '@angular/forms';
import { ProjectsService } from '../../services/projects.service';
import { Project, ProjectRequest } from '../../models/models';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';

@Component({
  selector: 'app-modal-current-project',
  templateUrl: './modal-current-project.component.html',
  styleUrls: ['./modal-current-project.component.scss'],
})
export class ModalCurrentProjectComponent implements OnInit {
  projCreateForm: FormGroup;
  activeProject: Project;

  constructor(
    public dialogRef: MatDialogRef<ModalCurrentProjectComponent>,
    private dialog: MatDialog,
    private projectsService: ProjectsService,
    @Inject(MAT_DIALOG_DATA) public projData: any,
  ) {}

  ngOnInit() {
    this.projectsService.activeProject.subscribe((next) => {
      this.activeProject = next;
    });

    this.projCreateForm = new FormGroup({
      name: new FormControl(this.activeProject.name),
      description: new FormControl(this.activeProject.description),
    });
  }

  close() {
    this.dialogRef.close();
  }

  delete() {
    if (
      confirm(
        'Are you sure you want to delete this project? This will also delete it from HazMapper, and anyone this project was shared with.',
      )
    ) {
      this.projectsService.delete(this.activeProject);
    }
    this.dialogRef.close();
  }

  update() {
    // The project is being properly assembled, but the problem is that the returned project isn't updating.
    // Do I need more data in my projects?
    /*
      export interface Project {
      description: string;
      id?: number;
      name: string;
      ds_id?: string;
      title?: string;
      uuid?: string;
      public?: boolean;
      system_file?: string;
      system_id?: string;
      system_path?: string;
      deleting?: boolean;
      deletingFailed?: boolean;
    }
     */
    const p = new Project();
    const projRqst = new ProjectRequest();

    p.description = this.projCreateForm.get('description').value;
    p.name = this.projCreateForm.get('name').value;
    p.id = this.activeProject.id;
    p.uuid = this.activeProject.uuid;

    projRqst.project = p;

    this.projectsService.update(projRqst);
    this.dialogRef.close();
  }
}
