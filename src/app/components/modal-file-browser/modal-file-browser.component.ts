import { Component, OnInit, Output, EventEmitter } from '@angular/core';
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

  @Output() currentPath: EventEmitter<string> = new EventEmitter<string>();

  private currentUser: AuthenticatedUser;
  public filesList: Array<RemoteFile> = [];
  public inProgress= true;
  public selectedFiles: Map<string, RemoteFile> = new Map();
  public onClose: Subject<Array<RemoteFile>> = new Subject<Array<RemoteFile>>();
  public projects: Array<SystemSummary>;
  private selectedSystem: SystemSummary;
  public myDataSystem: SystemSummary;
  public communityDataSystem: SystemSummary;
  public publishedDataSystem: SystemSummary;
  public currentDirectory: RemoteFile;

  constructor(private tapisFilesService: TapisFilesService,
		  // private modalRef: BsModalRef,
		  public dialogRef: MatDialogRef<ModalFileBrowserComponent>,
		  private dialog: MatDialog,
		  private authService: AuthService,
		  private agaveSystemsService: AgaveSystemsService) { }

  ngOnInit() {
	  // This finds all the projects, and file systems found from a user 
	this.agaveSystemsService.list();

	// TODO: change those hard coded systemIds to environment vars or some sort of config
	// wait on the currentUser and systems to resolve
	combineLatest([this.authService.currentUser, this.agaveSystemsService.systems, this.agaveSystemsService.projects])
	  .subscribe( ([user, systems, projects]) => {
	
		// Uses systems to find the different directories that has the files in
	this.myDataSystem = systems.find( (sys) => sys.id === 'designsafe.storage.default');
	this.communityDataSystem = systems.find( (sys) => sys.id === 'designsafe.storage.community');
	this.publishedDataSystem = systems.find( (sys) => sys.id === 'designsafe.storage.published');
	
	// This is where they choose which one they start with
	this.selectedSystem = this.myDataSystem;

	this.projects = projects;
	this.currentUser = user;
	const init = <RemoteFile> {	
		system: this.myDataSystem.id,
		type: 'dir',
		path: this.currentUser.username
	};
	console.log("WHATAT")
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
	console.log("YEAHHH")
	this.browse(init);
  }


  browse(file: RemoteFile) {
	if (file.type !== 'dir') { return; }
	console.log("HIYA")
	this.currentDirectory = file;
	// this.selectedFiles.clear();
	this.filesList = [];
	this.inProgress = true;
	this.getFiles();
  }

  getFiles() {
	this.inProgress = true;

	this.tapisFilesService.listFiles(this.currentDirectory.system, this.currentDirectory.path).subscribe(listing => {
		const files = listing.result;

		if (files.length && files[0].name === '.') {
			// This removes the first item in the listing, which in Agave
			// is always a reference to self '.' and replaces with '..'
			const current = files.shift();
			this.currentPath.next(current.path);
			current.path = this.tapisFilesService.getParentPath(current.path);
			current.name = '..';
			files.unshift(current);
		  }
		  const newFile = [];
		  files.forEach(function (value, index) {
          if (value.type == 'file' && (value.path.indexOf('jpg') !== -1) || value.type == 'dir'){
            newFile.push(value);
          }})

		  this.inProgress = false;
		  this.filesList = this.filesList.concat(newFile);
	}
	);
  }

 Nadi = "dummy dumb dumb";

  // TODO: Ian: Error message on incorrect file type?
  select(file: RemoteFile) {
	if (this.tapisFilesService.checkIfSelectable(file)) {
	  this.addSelectedFile(file);
	}
	else{
		console.log("not selectable")
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
	//   console.log(this.selectedFiles + "GOT HERE");
	}
  }

  chooseFiles() {
	const tmp = Array.from(this.selectedFiles.values());
	
	this.dialogRef.close(tmp)
  }

  cancel() {
	// this.modalRef.hide();
	this.dialogRef.close()
  }
}
