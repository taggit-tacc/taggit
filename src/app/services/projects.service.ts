import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, ReplaySubject} from 'rxjs';
import {Project} from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  private _projects: BehaviorSubject<Project[]> = new BehaviorSubject([]);
  public readonly projects: Observable<Project[]> = this._projects.asObservable();
  private _activeProject: ReplaySubject<Project> = new ReplaySubject<Project>(1);
  public readonly  activeProject: Observable<Project> = this._activeProject.asObservable();

  constructor(private http: HttpClient) { }

  //Queries database for all user projects.
  getProjects(): void {
   this.http.get<Project[]>(environment.apiUrl + `/projects/`).subscribe( resp => {
     this._projects.next(resp);
     //DEBUG: outputs results of query
     //console.log(this._projects.getValue())
   });
  }

  create(data: Project): Observable<Project> {
    const prom = this.http.post<Project>(environment.apiUrl + `/projects/`, data);
    prom.subscribe(proj => {
      //below code from here to next comment does nothing
      const p = new Project();
      p.name = 'test';
      p.description = 'test';
      // Spread operator, just pushes the new project into the array
      this._projects.next([...this._projects.value, proj]);
      // Set the active project to the one just created?
      this._activeProject.next(proj);
    });
    return prom;
  }

  setActiveProject(proj: Project): void {
    this._activeProject.next(proj);
  }

}
