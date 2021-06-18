import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import { ApiService} from 'ng-tapis';
import {RemoteFile} from 'ng-tapis';
import {Project} from '../models/models';
import {share} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {AuthService} from './authentication.service';
import { verify } from 'ts-mockito';

@Injectable({
  providedIn: 'root'
})
export class TapisFilesService {

  private baseUrl = 'https://agave.designsafe-ci.org/files/v2/';
  public currentListing: Array<RemoteFile>;
  private _listing: BehaviorSubject<RemoteFile[]> = new BehaviorSubject<RemoteFile[]>([]);
  public readonly listing: Observable<RemoteFile[]> = this._listing.asObservable();
  public readonly IMPORTABLE_TYPES: Array<string> = ['jpg', 'las', 'laz', 'json', 'geojson', 'geotiff', 'tiff', 'gpx'];

  constructor(private tapis: ApiService,
              private http: HttpClient,
              private authService: AuthService) { }

  checkIfSelectable(file: RemoteFile): boolean {
    if (file.type === 'dir') {return false; }
    const ext = this.getFileExtension(file);
    return this.IMPORTABLE_TYPES.includes(ext);
  }

  private getFileExtension(file: RemoteFile): string {
    return file.name.split('.').pop();
  }

  listFiles(system: string, path: string) {
    return this.tapis.filesList({systemId: system, filePath: path});
  }

  public getParentPath(path: string): string {
    const cleaned = path.replace('//', '/');
    const arr = cleaned.split('/');
    arr.pop();
    const parentPath = arr.join('/');
    return parentPath;
  }

  //saves project to a specified format in Design Safe's my Data section
  //TODO: ask Hazmapper guys how they got design safe to read a .hazmapper file
  //      and make a .tag file to link to their project
  public export(project: Project, systemID: String, path: string, fileName: string, data:any) {
    let combinedURL = `files/media/system/${systemID}${path}`
    //let fullURL = this.baseUrl + combinedURL
    //I think this is the proper URL, and the only reason it's not working is because we're not in a production build.
    //And we don't have a JWT
    let fullURL = "https://api.prod.tacc.cloud/" + combinedURL
    console.log(fullURL)

    let httpOptions = {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + this.authService.userToken.token,
        'X-JWT-Assertion-designsafe': environment.jwt
      })
    }
    //construct a file to submit
    let tmp: File = new File([data as BlobPart], fileName)
    let files = {'fileToUpload': tmp}
    this.http.post<any>(fullURL, files=files, httpOptions)
    .subscribe(resp => {
      console.log(resp)
    }, error => {
      console.log(error)
    })
    //this.tapis.filesImport()
  }
}
