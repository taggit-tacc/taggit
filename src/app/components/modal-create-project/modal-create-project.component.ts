import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { EnvService } from '../../services/env.service';
import { MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-modal-create-project',
  templateUrl: './modal-create-project.component.html',
  styleUrls: ['./modal-create-project.component.scss'],
})
export class ModalCreateProjectComponent implements OnInit {
  public readonly onClose: Subject<any> = new Subject<any>();

  projCreateForm: FormGroup;
  hazmapperLink: string;

  constructor(
    public dialogRef: MatDialogRef<ModalCreateProjectComponent>,
    private envService: EnvService,
  ) {}

  ngOnInit() {
    this.projCreateForm = new FormGroup({
      name: new FormControl(''),
      description: new FormControl(''),
    });
    this.hazmapperLink = this.envService.hazmapperUrl;
  }

  close() {
    this.dialogRef.close();
  }
}
