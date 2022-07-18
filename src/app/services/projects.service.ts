import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Project, IProjectUser, ProjectRequest } from '../models/models';
import { environment } from '../../environments/environment';
import { AuthService } from './authentication.service';
import { validateBBox } from '@turf/helpers';
import { NotificationsService } from './notifications.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private _projects: BehaviorSubject<Project[]> = new BehaviorSubject([]);
  public readonly projects: Observable<Project[]> =
    this._projects.asObservable();
  private _activeProject: ReplaySubject<Project> = new ReplaySubject<Project>(
    1
  );
  public readonly activeProject: Observable<Project> =
    this._activeProject.asObservable();
  private _projectUsers: ReplaySubject<Array<IProjectUser>> = new ReplaySubject<
    Array<IProjectUser>
  >(1);
  public readonly projectUsers$: Observable<Array<IProjectUser>> =
    this._projectUsers.asObservable();

  private _deletingProjects: BehaviorSubject<Project[]> = new BehaviorSubject<
    Project[]
  >([]);
  public deletingProjects: Observable<Project[]> =
    this._deletingProjects.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationsService: NotificationsService
  ) {}

  testGeoApi(): void {
    const data = {
      name: 'Awesome Project',
      description: 'Cool project',
    };
    const prom = this.http
      .post<Project>(`http://localhost:8888/projects/`, data)
      .subscribe((resp) => {
        this._projects.next([...this._projects.value, resp]);
        // Set the active project to the one just created?
        this._activeProject.next(resp);
      });

    this.http
      .get<Project[]>(`http://localhost:8888/projects/`)
      .subscribe((resp) => {
        this._projects.next(resp);
        //DEBUG: outputs results of query
        //console.log(this._projects.getValue())
      });
  }

  updateProjectsList(resp: Project[] = []) {
    const myProjs = resp.length !== 0 ? resp : this._projects.value;

    this._deletingProjects.value.length !== 0
      ? this._projects.next(
          myProjs.map((p) => {
            const deletingProj = this._deletingProjects.value.find(
              (dp) => dp.id === p.id
            );
            return deletingProj ? deletingProj : p;
          })
        )
      : this._projects.next(myProjs);
  }

  //Queries database for all user projects.
  getProjects(): void {
    this.http.get<Project[]>(environment.apiUrl + `/projects/`).subscribe(
      (resp) => {
        console.log(resp);
        this.updateProjectsList(resp);
        //DEBUG: outputs results of query
        //console.log(this._projects.getValue())
      },
      (error) => {
        this.notificationsService.showErrorToast(
          'Error importing files Design Safe, GeoAPI might be down'
        );
      }
    );
  }

  create(data: ProjectRequest): Observable<Project> {
    const prom = this.http.post<Project>(
      environment.apiUrl + `/projects/`,
      data
    );
    prom.subscribe((proj) => {
      // Spread operator, just pushes the new project into the array
      //console.log(data)
      this._projects.next([...this._projects.value, proj]);

      //Awkward as hell, but this ensures we actually transition to the newly created project
      //Without this, the screen flickers briefly to the new project, but ends up stuck on the old project
      this.setActiveProject(proj);
      this.setActiveProject(proj);
    });
    return prom;
  }

  setActiveProject(proj: Project): void {
    //saves change as last visited project
    window.localStorage.setItem('lastProj', JSON.stringify(proj));
    try {
      this._activeProject.next(proj);
    } catch (error) {
      return error;
    }
  }

  update(data: ProjectRequest): void {
    this.http
      .put<Project>(environment.apiUrl + `/projects/${data.project.id}/`, data)
      .subscribe((resp) => {
        this._activeProject.next(resp);
      });
  }

  //Note: This will delete the project for everyone, if the project is shared.
  delete(data: Project): void {
    console.log('We are in the function...');
    this._deletingProjects.next([
      ...this._deletingProjects.value,
      { ...data, deleting: true },
    ]);
    this.updateProjectsList();

    this.http.delete(environment.apiUrl + `projects/${data.id}/`).subscribe(
      (resp) => {
        window.localStorage.setItem('lastProj', JSON.stringify('none'));

        this._deletingProjects.next(
          this._deletingProjects.value.filter((p) => p.id !== data.id)
        );
        //These next two lines might be causing problems. Adding getProjects causes duplicates during project creation,
        //So I'm thinking that calling these here might be the root of my delete woes, as they're restoring the project I just
        //deleted...
        this.updateProjectsList();
        this.getProjects();
        //As elegant as a brick to the face, but this solves the delete issues...
        window.localStorage.setItem('lastProj', JSON.stringify('none'));
        // this._projects.next([...this._projects.value]);
        // console.log(this._projects.value[0])
        // this._activeProject.next(this._projects.value[0]);
      },
      (error) => {
        window.localStorage.setItem('lastProj', JSON.stringify('none'));

        this._deletingProjects.next(
          this._deletingProjects.value.map((p) => {
            return p.id === data.id
              ? { ...p, deleting: false, deletingFailed: true }
              : p;
          })
        );
        this.updateProjectsList();

        this.getProjects();

        this.notificationsService.showErrorToast('Could not delete project!');
        console.error(error);
      }
    ); // end of error
  }

  getProjectUsers(proj: Project): Observable<Array<IProjectUser>> {
    return this.http
      .get<Array<IProjectUser>>(
        environment.apiUrl + `/projects/${proj.id}/users/`
      )
      .pipe(
        tap((users) => {
          this._projectUsers.next(users);
        })
      );
  }

  addUserToProject(proj: Project, uname: string): void {
    const payload = {
      username: uname,
    };
    this.http
      .post(environment.apiUrl + `/projects/${proj.id}/users/`, payload)
      .subscribe((resp) => {
        this.getProjectUsers(proj).subscribe();
      });
  }

  deleteUserFromProject(proj: Project, user: string): void {
    this.http
      .delete(environment.apiUrl + `/projects/${proj.id}/users/${user}/`)
      .subscribe(
        (resp) => {
          this.getProjectUsers(proj).subscribe();
        },
        (error) => {
          //TODO: Create popup for an error message.
          console.log(error);
        }
      );
  }
}
