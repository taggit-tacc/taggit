import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { AgaveSystemsService } from '../../services/agave-systems.service';
import {
  AuthenticatedUser,
  AuthService,
} from '../../services/authentication.service';
import { RemoteFile } from 'ng-tapis/models/remote-file';
import { SystemSummary } from 'ng-tapis';
import { TapisFilesService } from '../../services/tapis-files.service';
import { BsModalRef } from 'ngx-foundation/modal/bs-modal-ref.service';
import { Subject, combineLatest } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { take } from 'rxjs/operators';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-modal-download-selector',
  templateUrl: './modal-download-selector.component.html',
  styleUrls: ['./modal-download-selector.component.scss'],
})
export class ModalDownloadSelectorComponent implements OnInit {
  static limit = 200; // Limits maximum amount of files displayed

  @Output() currentPath: EventEmitter<string> = new EventEmitter<string>();

  private downloadSelectForm: FormGroup;
  private currentUser: AuthenticatedUser;
  public filesList: Array<RemoteFile> = [];
  public inProgress = true;
  public selectedFiles: Map<string, RemoteFile> = new Map();
  public onClose: Subject<Array<RemoteFile>> = new Subject<Array<RemoteFile>>();
  public projects: Array<SystemSummary>;
  private selectedSystem: SystemSummary;
  public myDataSystem: SystemSummary;
  public communityDataSystem: SystemSummary;
  public publishedDataSystem: SystemSummary;
  public currentDirectory: RemoteFile;
  public passbackData: Array<string> = ['', '', '', ''];
  public fileName = '';
  public fileExtension = '.zip';
  private offset: number;

  constructor(
    private tapisFilesService: TapisFilesService,
    // private modalRef: BsModalRef,
    public dialogRef: MatDialogRef<ModalDownloadSelectorComponent>,
    private dialog: MatDialog,
    private authService: AuthService,
    private agaveSystemsService: AgaveSystemsService
  ) {}

  ngOnInit() {
    this.downloadSelectForm = new FormGroup({
      Name: new FormControl(this.fileName),
      Extension: new FormControl(this.fileExtension),
    });

    // This finds all the projects, and file systems found from a user
    this.agaveSystemsService.list();

    // TODO: change those hard coded systemIds to environment vars or some sort of config
    // wait on the currentUser and systems to resolve
    combineLatest([
      this.authService.currentUser,
      this.agaveSystemsService.systems,
      this.agaveSystemsService.projects,
    ])
      // This little thing helped me fix the problem on calling ngOnInit several times
      .pipe(take(1))
      .subscribe(([user, systems, projects]) => {
        // Uses systems to find the different directories that has the files in
        this.myDataSystem = systems.find(
          (sys) => sys.id === 'designsafe.storage.default'
        );
        this.communityDataSystem = systems.find(
          (sys) => sys.id === 'designsafe.storage.community'
        );
        this.publishedDataSystem = systems.find(
          (sys) => sys.id === 'designsafe.storage.published'
        );

        // This is where they choose which one they start with
        this.selectedSystem = this.myDataSystem;

        this.projects = projects;
        this.currentUser = user;
        const init = <RemoteFile> {
          system: this.myDataSystem.id,
          type: 'dir',
          path: this.currentUser.username,
        };
        this.browse(init);
      });
  }

  selectSystem(system: SystemSummary): void {
    let pth;
    system.id === this.myDataSystem.id
      ? (pth = this.currentUser.username)
      : (pth = '/');
    const init = <RemoteFile> {
      system: system.id,
      type: 'dir',
      path: pth,
    };
    this.browse(init);
  }

  browse(file: RemoteFile) {
    if (file.type !== 'dir') {
      return;
    }
    this.currentDirectory = file;
    // this.selectedFiles.clear();
    this.filesList = [];
    this.offset = 0;
    this.inProgress = false;
    this.getFiles();
  }

  getFiles() {
    const hasMoreFiles =
      this.offset % ModalDownloadSelectorComponent.limit === 0;

    if (this.inProgress || !hasMoreFiles) {
      return;
    }

    this.inProgress = true;

    this.tapisFilesService
      .listFiles(
        this.currentDirectory.system,
        this.currentDirectory.path,
        this.offset,
        ModalDownloadSelectorComponent.limit
      )
      .subscribe(
        (response) => {
          // Add 'system' to results to match v2
          const files = response.result.map((f) => ({
            ...f,
            system: this.currentDirectory.system,
          }));

          this.currentPath.next(this.currentDirectory.path);
          this.passbackData[1] = this.currentDirectory.path;

          // If this is the first load, add the '..' entry for users to move to parent path
          if (this.offset === 0) {
            const backPath = {
              name: '..',
              format: 'folder',
              type: 'dir',
              mimeType: 'test/directory',
              size: 8192,
              path: this.tapisFilesService.getParentPath(this.currentDirectory.path),
              system: this.currentDirectory.system,
            };
            this.filesList.unshift(backPath);
          }

          this.inProgress = false;
          this.filesList = this.filesList.concat(files);
          this.offset = this.offset + files.length;
        },
        (error) => {
          this.inProgress = false;
        }
      );
  }

  chooseFiles() {
    this.passbackData[0] = this.selectedSystem.id;
    this.passbackData[2] = this.downloadSelectForm.get('Name').value;
    this.passbackData[3] = this.fileExtension;
    this.dialogRef.close(this.passbackData);
  }

  cancel() {
    this.dialogRef.close();
  }
}
