import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import { ApiService} from 'ng-tapis';
import {RemoteFile} from 'ng-tapis';
import {share} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TapisFilesService {

  private baseUrl = 'https://agave.designsafe-ci.org/files/v2/';
  public currentListing: Array<RemoteFile>;
  private _listing: BehaviorSubject<RemoteFile[]> = new BehaviorSubject<RemoteFile[]>([]);
  public readonly listing: Observable<RemoteFile[]> = this._listing.asObservable();
  public readonly IMPORTABLE_TYPES: Array<string> = ['jpg', 'las', 'laz', 'json', 'geojson', 'geotiff', 'tiff', 'gpx'];

  constructor(private tapis: ApiService) { }

  checkIfSelectable(file: RemoteFile): boolean {
    if (file.type === 'dir') {return false; }
    const ext = this.getFileExtension(file);
    return this.IMPORTABLE_TYPES.includes(ext);
  }

  private getFileExtension(file: RemoteFile): string {
    return file.name.split('.').pop();
  }

  listFiles(system: string, path: string) {
    this.tapis.filesList({systemId: system, filePath: path})
      .subscribe(resp => {
	const files = resp.result;
	// This removes the first item in the listing, which in Agave is always a reference to self.
	const current = files.shift();
	current.path = this.getParentPath(current.path);
	current.name = '..';
	files.unshift(current);
	this._listing.next(files);
      });
  }

  private getParentPath(path: string): string {
    const cleaned = path.replace('//', '/');
    const arr = cleaned.split('/');
    arr.pop();
    const parentPath = arr.join('/');
    return parentPath;
  }
}
