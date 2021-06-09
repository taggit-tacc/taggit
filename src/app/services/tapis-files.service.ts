import {Injectable, resolveForwardRef} from '@angular/core';
import {BehaviorSubject, Observable, AsyncSubject, throwError} from 'rxjs';
import { ApiService} from 'ng-tapis';
import {RemoteFile} from 'ng-tapis';
import {share, catchError} from 'rxjs/operators';
import { getValueFromObject } from 'ngx-foundation/typeahead';
import { CursorError } from '@angular/compiler/src/ml_parser/lexer';

@Injectable({
  providedIn: 'root'
})
export class TapisFilesService {

  private baseUrl = 'https://agave.designsafe-ci.org/files/v2/';
  public currentListing: Array<RemoteFile>;
  public _listing: BehaviorSubject<RemoteFile[]> = new BehaviorSubject<RemoteFile[]>([]);
  public lester: AsyncSubject<RemoteFile[]> = new AsyncSubject<RemoteFile[]>();
  public readonly lesting: Observable<RemoteFile[]> = this.lester.asObservable()
  public readonly listing: Observable<RemoteFile[]> = this._listing.asObservable();
  public readonly IMPORTABLE_TYPES: Array<string> = ['jpg', 'las', 'laz', 'json', 'geojson', 'geotiff', 'tiff', 'gpx'];

  constructor(private tapis: ApiService) { }

  checkIfSelectable(file: RemoteFile): boolean {
    if (file.type === 'dir') {return false; }
    //const ext = this.getFileExtension(file);
    //return this.IMPORTABLE_TYPES.includes(ext);
    return true
  }

  private getFileExtension(file: RemoteFile): string {
    return file.name.split('.').pop();
  }


  listFiles = async (system: string, path: string): Promise<RemoteFile[]> => {
    let lister: RemoteFile[] = [];
    return new Promise<RemoteFile[]>((resolve) => {
      let subscriber1 = this.tapis.filesList({ systemId: system, filePath: path })
        .subscribe(resp => {
          const files = resp.result;
          // This removes the first item in the listing, which in Agave is always a reference to self.
          const current = files.shift();
          current.path = this.getParentPath(current.path);
          current.name = '..';
          files.unshift(current);

          const newFile = [];
          files.forEach(function (value, index) {
          if (value.type == 'file' && (value.path.indexOf('jpg') !== -1) || value.type == 'dir'){
            newFile.push(value);
            }
          })

          this._listing.next(newFile)
          this.lester.next(newFile)
            if (this.lester.complete) {
              // console.log('ready now')
              lister = this._listing.getValue()
              subscriber1.unsubscribe()
              this._listing.complete()
              resolve(lister)
            }
        })
    })
  };


  private getParentPath(path: string): string {
    const cleaned = path.replace('//', '/');
    const arr = cleaned.split('/');
    arr.pop();
    const parentPath = arr.join('/');
    return parentPath;
  }
}