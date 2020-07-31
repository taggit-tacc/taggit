import { Injectable } from '@angular/core';
import {SystemSummary} from 'ng-tapis';
import { ApiService } from 'ng-tapis';
import {Observable, ReplaySubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AgaveSystemsService {

  private baseUrl = 'https://agave.designsafe-ci.org/systems/v2/';
  private _systems: ReplaySubject<SystemSummary[]> = new ReplaySubject<SystemSummary[]>(1);
  public readonly systems: Observable<SystemSummary[]> = this._systems.asObservable();
  private _projects: ReplaySubject<SystemSummary[]> = new ReplaySubject<SystemSummary[]>(1);
  public readonly projects: Observable<SystemSummary[]> = this._projects.asObservable();
  private systemsList: SystemSummary[];

  constructor(private tapis: ApiService) { }

  list() {
    this.tapis.systemsList({type: 'STORAGE'})
      .subscribe(resp => {
        this._systems.next(resp.result);
        this._projects.next(resp.result.filter(sys => sys.id.startsWith('project')));
      }, error => {
        this._systems.next(null);
        this._projects.next(null);
      });
  }
}
