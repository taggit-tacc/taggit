import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import {AgaveSystemsService} from '../../services/agave-systems.service';
import {AuthenticatedUser, AuthService} from '../../services/authentication.service';
import { RemoteFile} from 'ng-tapis/models/remote-file';
import { SystemSummary} from 'ng-tapis';
import { TapisFilesService } from '../../services/tapis-files.service';
import { BsModalRef } from 'ngx-foundation/modal/bs-modal-ref.service';
import { Subject, combineLatest} from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-modal-file-browser',
  templateUrl: './modal-file-browser.component.html',
  styleUrls: ['./modal-file-browser.component.scss'],
})
export class ModalFileBrowserComponent implements OnInit {

  static limit = 200; //Limits maximum amount of files displayed

  @Output() currentPath: EventEmitter<string> = new EventEmitter<string>();

  public allowedExtensions: Array<string> = this.tapisFilesService.IMPORTABLE_TYPES;
 
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
  private offset:number;
  public firstFileIndex: number;

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
	
	// This little thing helped me fix the problem on calling ngOnInit several times
	.pipe(
        take(1)
      )
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
	this.currentDirectory = file;
	// this.selectedFiles.clear();
	this.filesList = [];
	this.offset = 0
	this.inProgress = false;
	this.getFiles();
  }

  getFiles() {
	let hasMoreFiles = (this.offset % ModalFileBrowserComponent.limit) === 0

	if (this.inProgress || !hasMoreFiles){
		return;
	}

	this.inProgress = true;

	this.tapisFilesService.listFiles(this.currentDirectory.system, this.currentDirectory.path, this.offset, ModalFileBrowserComponent.limit)
	.subscribe(listing => {
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
		  const allowedExt = this.allowedExtensions
		  files.forEach(function (value, index) {
          if ((value.type == 'file' && allowedExt.includes(value.path.split('.').pop().toLowerCase()) ) || value.type == 'dir'){
            newFile.push(value);
          }})

		  this.inProgress = false;
		  this.filesList = this.filesList.concat(newFile);
		  this.offset = this.offset + files.length
	},
	error => {
		this.inProgress = false;
	});
  }

  // TODO: Ian: Error message on incorrect file type?
  select(event: any,file: RemoteFile, index: number) {
	if (event.shiftKey) {
		this.selectFilesShiftClick(index, file);
	  }
	else {
		if (this.tapisFilesService.checkIfSelectable(file)) {
			this.addSelectedFile(file, index);
		}
		else{
			// console.log("not selectable")
	}
	}
	// here?
	// else {
	//   Signal Error!
	// }
  }

  selectFilesShiftClick(index: number, file: RemoteFile) {
    // this.selectedFiles.clear();
    this.selectShift(index, file);
  }


  addSelectedFile(file: RemoteFile, index: number) {
	if (index != -1) {
		this.firstFileIndex = index;
	  }

	if(this.tapisFilesService.checkIfSelectable(file)){
		if (this.selectedFiles.has(file.path)) {
			this.selectedFiles.delete(file.path);
		} else {
			this.selectedFiles.set(file.path, file);
		//   console.log(this.selectedFiles + "GOT HERE");
		}
	}
  }

  chooseFiles() {
	const tmp = Array.from(this.selectedFiles.values());
	this.dialogRef.close(tmp)
  }

  cancel() {
	this.dialogRef.close()
  }

  selectAll(){
	  let indexTmp = -1
	  let count = 0
	  for(let file of this.filesList){
		if (! this.selectedFiles.has(file.path)) {
			this.select("",file,indexTmp)
			count += 1
		}
	  }
	  console.log(count)
	  if (count == 1){
		this.selectedFiles.clear();
	  }
  }

  selectShift(index: number, file: RemoteFile) {
    if (this.firstFileIndex != undefined && this.firstFileIndex != index) {
      this.addRangeFiles(this.firstFileIndex, index, true);
    } else {
      this.addSelectedFile(file, index);
    }
  }

  addRangeFiles(firstFileIndex: number, lastFileIndex: number, again: boolean) {
    let maxIndex = Math.max(firstFileIndex, lastFileIndex);
    let minIndex = Math.min(firstFileIndex, lastFileIndex);

    for (let i = minIndex; i < maxIndex + 1; ++i) {
      this.addSelectedFile(this.filesList[i], -1);
    }

    if (again) {
      this.addSelectedFile(this.filesList[firstFileIndex], -1);
    }
  }
}
