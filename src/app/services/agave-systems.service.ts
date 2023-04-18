import { Injectable } from '@angular/core';
import { SystemSummary } from 'ng-tapis';
import { ApiService } from 'ng-tapis';
import { EnvService } from './env.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { DesignSafeProjectCollection, Project, AgaveFileOperations } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class AgaveSystemsService {
  private baseUrl = 'https://agave.designsafe-ci.org/systems/v2/';
  private _systems: ReplaySubject<SystemSummary[]> = new ReplaySubject<
    SystemSummary[]
  >(1);
  public readonly systems: Observable<SystemSummary[]> =
    this._systems.asObservable();
  private _projects: ReplaySubject<SystemSummary[]> = new ReplaySubject<
    SystemSummary[]
  >(1);
  public readonly projects: Observable<SystemSummary[]> =
    this._projects.asObservable();
  private systemsList: SystemSummary[];

  constructor(
    private tapis: ApiService,
    private envService: EnvService,
    private http: HttpClient
  ) {}

  // list() runs when the file browser is opened, retrieves all files in TACC for given user
  list() {
    this.tapis.systemsList({ type: 'STORAGE' }).subscribe(
      (resp) => {
        this._systems.next(resp.result);
        this._projects.next(
          resp.result.filter((sys) => sys.id.startsWith('project'))
        );
      },
      (error) => {
        this._systems.next(null);
        this._projects.next(null);
      }
    );

    this.http.get<DesignSafeProjectCollection>(this.envService.designSafeUrl + `/projects/v2/`).subscribe(
      (resp) => {
        const projectSystems = resp.projects.map((project) => {
          return {
            id: 'project-' + project.uuid,
            name: project.value.projectId,
            description: project.value.title,
          };
        });
        this._projects.next(projectSystems);
      },
      (error) => {
        this._projects.next(null);
      }
    );
  }

  getProjectMetadata(projects: Project[], dsProjects: SystemSummary[]): Project[] {
    if (dsProjects.length > 0) {
      return projects.map((p) => {
        const dsProject = dsProjects.find((dp) => dp.id === p.system_id);
        p.title = dsProject ? dsProject.description : null;
        p.ds_id = dsProject ? dsProject.name : null;
        return p;
      });
    }
    return projects;
  }

}
