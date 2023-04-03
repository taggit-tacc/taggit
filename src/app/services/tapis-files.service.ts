import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService, FileOperationRequest } from 'ng-tapis';
import { RemoteFile } from 'ng-tapis';
import { Project } from '../models/models';
import { share } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { AuthService } from './authentication.service';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { SystemSummary } from 'ng-tapis';
// import { verify } from 'ts-mockito';

@Injectable({
  providedIn: 'root',
})
export class TapisFilesService {
  private baseUrl = 'https://agave.designsafe-ci.org/files/v2/';
  public currentListing: Array<RemoteFile>;
  private _listing: BehaviorSubject<RemoteFile[]> = new BehaviorSubject<
    RemoteFile[]
  >([]);
  public readonly listing: Observable<RemoteFile[]> =
    this._listing.asObservable();
  public readonly IMPORTABLE_TYPES: Array<string> = [
    'jpg',
    'jpeg',
    'las',
    'laz',
    'json',
    'geojson',
    'geotiff',
    'tiff',
    'gpx',
  ];
  public lastSystem: SystemSummary; // The last filesystem the user was browsing
  public lastFile: RemoteFile; // The last directory the user was browsing
  public noPreviousSelections: boolean;

  constructor(
    private tapis: ApiService,
    private http: HttpClient,
    private authService: AuthService,
    private popup: MatSnackBar
  ) {}

  checkIfSelectable(file: RemoteFile): boolean {
    if (file.type === 'dir') {
      return false;
    }
    const ext = this.getFileExtension(file);
    return this.IMPORTABLE_TYPES.includes(ext);
  }

  private getFileExtension(file: RemoteFile): string {
    return file.name.split('.').pop().toLowerCase();
  }

  listFiles(system: string, path: string, offset: number, limit: number) {
    return this.tapis.filesList({
      systemId: system,
      filePath: path,
      offset,
      limit,
    });
  }

  public getParentPath(path: string): string {
    const cleaned = path.replace('//', '/');
    const arr = cleaned.split('/');
    arr.pop();
    const parentPath = arr.join('/');
    return parentPath;
  }

  // saves project to a specified format in Design Safe's my Data section
  public export(
    systemID: string,
    path: string,
    fileName: string,
    extension: string,
    data: any
  ) {
    // Constructs an object that configures the success/error pop-up
    const snackbarConfig: MatSnackBarConfig = {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    };
    // construct the full URL that points to where the data will be stored
    const fullURL = `https://agave.designsafe-ci.org/files/v2/media/system/${systemID}${path}`;

    // construct a file to submit
    const tmp = new Blob([data], { type: 'blob' });
    const date = new Date();
    const file = new File([tmp], fileName + '.zip', { lastModified: date.valueOf() });

    // Creates a form data object which holds the file to be uploaded
    const form: FormData = new FormData();
    form.append('fileToUpload', file);

    // sends the packaged data to Designsafe. URL its being uploaded to handles authentication
    this.http.post(fullURL, form).subscribe(
      (resp) => {
        console.log(resp);
        const msg = 'Successfully saved file to ' + systemID + path;
        this.popup.open(msg, '', snackbarConfig);
      },
      (error) => {
        console.log(error);
        const msg = 'Faled to save file to ' + systemID + path;
        this.popup.open(msg, '', snackbarConfig);
      }
    );
  }

  // Saves the current file directory and file system to Local Storage
  saveState() {
    const sysStr = JSON.stringify(this.lastSystem);
    const fileStr = JSON.stringify(this.lastFile);
    window.localStorage.setItem('system', sysStr);
    window.localStorage.setItem('file', fileStr);
  }

  // Attempts to retrieve the last used state
  getState() {
    try {
      this.lastSystem = JSON.parse(window.localStorage.getItem('system'));
      this.lastFile = JSON.parse(window.localStorage.getItem('file'));
      this.noPreviousSelections = this.lastFile == null;
    } catch (error) {
      console.log(error);
    }
  }
}
