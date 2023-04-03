import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Project, IProjectUser, ProjectRequest } from '../models/models';
import { EnvService } from './env.service';
import { AuthService } from './authentication.service';
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


  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private envService: EnvService,
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
      });
  }

  // Queries database for all user projects.
  getProjects(): void {
    this.http.get<Project[]>(this.envService.apiUrl + `/projects/`).subscribe(
      (projects) => {
        this._projects.next(projects);
      },
      (error) => {
        this.notificationsService.showErrorToast(
          'Error getting projects DesignSafe or GeoAPI might be down'
        );
      }
    );
  }

  create(data: ProjectRequest) {
    this.http.post<Project>(
      this.envService.apiUrl + `/projects/`,
      data
    ).subscribe((proj) => {
      // Adding deletable attribute as missing from response https://jira.tacc.utexas.edu/browse/DES-2381
      proj = {...proj, deletable: true};
      this.setActiveProject(proj);
      this._projects.next([...this._projects.value, proj]);
    });
  }

  setActiveProject(proj: Project): void {
    // saves change as last visited project
    window.localStorage.setItem('lastProj', JSON.stringify(proj));
    try {
      this._activeProject.next(proj);
    } catch (error) {
      return error;
    }
  }

  update(data: ProjectRequest): void {
    this.http
      .put<Project>(this.envService.apiUrl + `/projects/${data.project.id}/`, data)
      .subscribe((resp) => {
        this._activeProject.next(resp);
        this.getProjects();
      });
  }

  // Note: This will delete the project for everyone, if the project is shared.
  delete(data: Project): void {
    this.http.delete(this.envService.apiUrl + `projects/${data.id}/`).subscribe(
      (resp) => {
        window.localStorage.removeItem('lastProj');
        this.getProjects();
      },
      (error) => {
        this.notificationsService.showErrorToast('Could not delete project!');
        console.error(error);
      }
    );
  }

  getProjectUsers(proj: Project): Observable<Array<IProjectUser>> {
    return this.http
      .get<Array<IProjectUser>>(
        this.envService.apiUrl + `/projects/${proj.id}/users/`
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
      .post(this.envService.apiUrl + `/projects/${proj.id}/users/`, payload)
      .subscribe((resp) => {
        this.getProjectUsers(proj).subscribe();
      });
  }

  deleteUserFromProject(proj: Project, user: string): void {
    this.http
      .delete(this.envService.apiUrl + `/projects/${proj.id}/users/${user}/`)
      .subscribe(
        (resp) => {
          this.getProjectUsers(proj).subscribe();
        },
        (error) => {
          // TODO: Create popup for an error message.
          console.log(error);
        }
      );
  }
}
