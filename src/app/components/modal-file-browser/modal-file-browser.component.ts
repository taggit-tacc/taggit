import { Component, OnInit } from '@angular/core';
import {AgaveSystemsService} from '../../services/agave-systems.service';
import {AuthenticatedUser, AuthService} from '../../services/authentication.service';
import { RemoteFile} from 'ng-tapis/models/remote-file';
import { SystemSummary} from 'ng-tapis';
import { TapisFilesService } from '../../services/tapis-files.service';
import { BsModalRef } from 'ngx-foundation/modal/bs-modal-ref.service';
import { Subject, combineLatest} from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-file-browser',
  templateUrl: './modal-file-browser.component.html',
  styleUrls: ['./modal-file-browser.component.scss'],
})
export class ModalFileBrowserComponent implements OnInit {

  private currentUser: AuthenticatedUser;
  public filesList: Array<RemoteFile>;
  public inProgress: boolean;
  public selectedFiles: Map<string, RemoteFile> = new Map();
  public onClose: Subject<Array<RemoteFile>> = new Subject<Array<RemoteFile>>();
  public projects: Array<SystemSummary>;
  private selectedSystem: SystemSummary;
  public myDataSystem: SystemSummary;
  public communityDataSystem: SystemSummary;
  public publishedDataSystem: SystemSummary;

  constructor(private tapisFilesService: TapisFilesService,
		  // private modalRef: BsModalRef,
		  public dialogRef: MatDialogRef<ModalFileBrowserComponent>,
		  private dialog: MatDialog,
		  private authService: AuthService,
		  private agaveSystemsService: AgaveSystemsService) { }

  ngOnInit() {
	this.agaveSystemsService.list();

	// TODO: change those hard coded systemIds to environment vars or some sort of config
	// wait on the currentUser and systems to resolve
	combineLatest([this.authService.currentUser, this.agaveSystemsService.systems, this.agaveSystemsService.projects])
	  .subscribe( ([user, systems, projects]) => {
	this.myDataSystem = systems.find( (sys) => sys.id === 'designsafe.storage.default');
	this.communityDataSystem = systems.find( (sys) => sys.id === 'designsafe.storage.community');
	this.publishedDataSystem = systems.find( (sys) => sys.id === 'designsafe.storage.published');
	this.selectedSystem = this.myDataSystem;
	this.projects = projects;
	this.currentUser = user;
	const init = <RemoteFile> {
	  system: this.myDataSystem.id,
	  type: 'dir',
	  path: this.currentUser.username
	};
	this.browse(init);
	  });

  }

  selectSystem(system: SystemSummary): void {
	let pth;
	system.id === this.myDataSystem.id ? pth = this.currentUser.username : pth = '/';
	const init = <RemoteFile> {
	  system: system.id,
	  type: 'dir',
	  path: pth
	};
	this.browse(init);
  }


  browse(file: RemoteFile) {
	if (file.type !== 'dir') { return; }
	this.inProgress = true;
	this.selectedFiles.clear();
	this.tapisFilesService.listFiles(file.system, file.path);
	this.tapisFilesService.listing.subscribe(listing => {
	  this.inProgress = false;
	  this.filesList = listing;
	});
  }

  // TODO: Ian: Error message on incorrect file type?
  select(file: RemoteFile) {
	if (this.tapisFilesService.checkIfSelectable(file)) {
	  this.addSelectedFile(file);
	}
	// here?
	// else {
	//   Signal Error!
	// }
  }

  addSelectedFile(file: RemoteFile) {
	if (this.selectedFiles.has(file.path)) {
	  this.selectedFiles.delete(file.path);
	} else {
	  this.selectedFiles.set(file.path, file);
	}
  }

  chooseFiles() {
	const tmp = Array.from(this.selectedFiles.values());
	// this.onClose.next(tmp);
	// this.modalRef.hide();
	this.dialogRef.close(tmp)
  }

  cancel() {
	// this.modalRef.hide();
	this.dialogRef.close()
  }
}
