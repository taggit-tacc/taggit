import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import {BehaviorSubject, Observable, ReplaySubject} from 'rxjs';
import {tap} from 'rxjs/operators';
import {Project, IProjectUser} from '../models/models';
import { environment } from '../../environments/environment';
import {AuthService} from './authentication.service';
import { validateBBox } from '@turf/helpers';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  private _projects: BehaviorSubject<Project[]> = new BehaviorSubject([]);
  public readonly projects: Observable<Project[]> = this._projects.asObservable();
  private _activeProject: ReplaySubject<Project> = new ReplaySubject<Project>(1);
  public readonly  activeProject: Observable<Project> = this._activeProject.asObservable();
  private _projectUsers: ReplaySubject<Array<IProjectUser>> = new ReplaySubject<Array<IProjectUser>>(1);
  public readonly projectUsers$: Observable<Array<IProjectUser>> = this._projectUsers.asObservable();

  constructor(private http: HttpClient,
    private authService: AuthService) { }

    testGeoApi():void {
      const data = {
        "name": "Awesome Project",
      "description": "Cool project"
      }
      const prom = this.http.post<Project>(`http://localhost:8888/projects/`, data).subscribe( resp => {
        this._projects.next([...this._projects.value, resp]);
      // Set the active project to the one just created?
      this._activeProject.next(resp);
      });

      this.http.get<Project[]>(`http://localhost:8888/projects/`).subscribe( resp => {
        this._projects.next(resp);
        //DEBUG: outputs results of query
        //console.log(this._projects.getValue())
      });
    }

  //Queries database for all user projects.
  getProjects(): void {
   this.http.get<Project[]>(environment.apiUrl + `/projects/`).subscribe( resp => {
     this._projects.next(resp);
     //DEBUG: outputs results of query
     //console.log(this._projects.getValue())
   }, error => {
    console.log("HAHAHA NOPE")
  });
  }

  create(data: Project): Observable<Project> {
    console.log(environment.apiUrl )
    const prom = this.http.post<Project>(environment.apiUrl + `/projects/`, data);
    prom.pipe(
      tap(proj => {
      //below code from here to next comment does nothing
      // const p = new Project();
      // p.name = 'test';
      // p.description = 'test';
      // Spread operator, just pushes the new project into the array
      this._projects.next([...this._projects.value, proj]);
      // Set the active project to the one just created?
      this._activeProject.next(proj);

    }, error => {
      console.log("HAHAHA NOPE")
    }),);
    console.log(this._activeProject)
    return prom;
  }

  setActiveProject(proj: Project): void {
    this._activeProject.next(proj);
  }

  
  update(data: Project): void{
    // console.log(data) 
    this.http.put<Project>(environment.apiUrl + `/projects/${data.id}/`, data).subscribe(
      (resp) => {
        this._activeProject.next(resp);
      }
    );
  }

  //Note: This will delete the project for everyone, if the project is shared. 
  // Need to find a way to unsubscribe a project for one person without affecting the others.
  delete(data: Project):void{
    this.http.delete(environment.apiUrl  + `/projects/${data.id}/`)
      .subscribe( (resp) => {
        this.getProjects();
        // this._projects.next([...this._projects.value]);
        // console.log(this._projects.value[0])
        // this._activeProject.next(this._projects.value[0]);
      });
  }

  getProjectUsers(proj: Project): Observable<Array<IProjectUser>> {
    return this.http.get<Array<IProjectUser>>(environment.apiUrl + `/projects/${proj.id}/users/`).pipe(
      tap(users => {
        this._projectUsers.next(users);
      }));
  }

  addUserToProject(proj: Project, uname: string): void {
    const payload = {
      username: uname
    };
    this.http.post(environment.apiUrl + `/projects/${proj.id}/users/`, payload)
      .subscribe( (resp) => {
        this.getProjectUsers(proj).subscribe();
      });
  }

  deleteUserFromProject(proj:Project, user:string): void {
    this.http.delete(environment.apiUrl + `/projects/${proj.id}/users/${user}/`)
    .subscribe((resp)=>{
      this.getProjectUsers(proj).subscribe();
    },error =>{
      //TODO: Create popup for an error message.
      console.log(error)
    })
  }
}
