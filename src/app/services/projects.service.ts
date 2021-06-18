import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import {BehaviorSubject, Observable, ReplaySubject} from 'rxjs';
import {Project} from '../models/models';
import { environment } from '../../environments/environment';
import {AuthService} from './authentication.service';
import { validateBBox } from '@turf/helpers';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  private _projects: BehaviorSubject<Project[]> = new BehaviorSubject([]);
  public readonly projects: Observable<Project[]> = this._projects.asObservable();
  private _activeProject: ReplaySubject<Project> = new ReplaySubject<Project>(1);
  public readonly  activeProject: Observable<Project> = this._activeProject.asObservable();

  constructor(private http: HttpClient,
    private authService: AuthService) { }

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

  //saves project to a specified format in Design Safe's my Data section
  //TODO: ask Hazmapper guys how they got design safe to read a .hazmapper file
  //      and make a .tag file to link to their project
  exportProject(project: Project, systemID: String, path: string, fileName: string, data:any) {
    let payload = {systemID, path, fileName, data}
    let httpOptions = {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + this.authService.userToken.token,
        'X-JWT-Assertion-designsafe': environment.jwt
      })
    }

    this.http.put<any>(environment.apiUrl + `projects/${project.id}/export/`, payload, httpOptions)
    .subscribe(resp => {
      console.log(resp.message)
      this._projects.next([...this._projects.value.filter((item) => item.id != project.id), resp]);
      this._activeProject.next(resp);
    }, error => {
      console.log(error)
      console.log(payload)
    })
  }
}
