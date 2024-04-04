import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { EnvironmentType } from '../../environments/environmentType';

@Injectable({
  providedIn: 'root'
})
export class EnvService {
  private _env: EnvironmentType;
  private _apiUrl: string;
  private _portalUrl: string;
  private _jwt?: string;
  private _clientId: string;
  private _baseHref: string;
  private _hazmapperUrl: string;

  private getHazmapperUrl(backend: EnvironmentType): string {
    if (backend === EnvironmentType.Local) {
      return 'http://localhost:4200/';
    } else if (backend === EnvironmentType.Staging) {
      return 'https://hazmapper.tacc.utexas.edu/staging';
    } else if (backend === EnvironmentType.Dev) {
      return 'https://hazmapper.tacc.utexas.edu/dev';
    } else if (backend === EnvironmentType.Experimental) {
      return 'https://hazmapper.tacc.utexas.edu/exp';
    } else if (backend === EnvironmentType.Production) {
      return 'https://hazmapper.tacc.utexas.edu/hazmapper';
    } else {
      throw new Error('Unsupported Type');
    }
  }

  private getApiUrl(backend: EnvironmentType): string {
    if (backend === EnvironmentType.Local) {
      return 'http://localhost:8888';
    } else if (backend === EnvironmentType.Staging) {
      return 'https://staging.geoapi-services.tacc.utexas.edu:8000';
    } else if (backend === EnvironmentType.Production) {
      return 'https://prod.geoapi-services.tacc.utexas.edu:8000';
    } else if (backend === EnvironmentType.Dev) {
      return 'https://dev.geoapi-services.tacc.utexas.edu:8000';
    } else if (backend === EnvironmentType.Experimental) {
      return 'https://experimental.geoapi-services.tacc.utexas.edu:8000';
    } else {
      throw new Error('Unsupported Type');
    }
  }

  private getPortalUrl(backend: EnvironmentType): string {
    if (backend === EnvironmentType.Production) {
      return 'https://www.designsafe-ci.org/';
    } else if (backend === EnvironmentType.Experimental) {
      return 'https://designsafeci-next.tacc.utexas.edu/';
    } else {
      return 'https://designsafeci-dev.tacc.utexas.edu/';
    }
  }

  get isProduction(): boolean {
    return this._env === EnvironmentType.Production;
  }

  get env(): EnvironmentType {
    return this._env;
  }

  get apiUrl(): string {
    return this._apiUrl;
  }

  get jwt(): string {
    return this._jwt;
  }

  get clientId(): string {
    return this._clientId;
  }

  get baseHref(): string {
    return this._baseHref;
  }

  get hazmapperUrl(): string {
    return this._hazmapperUrl;
  }

  get designSafeUrl(): string {
    // TODO_TAPISV3
    return 'https://agave.designsafe-ci.org/';
  }

  get portalUrl(): string {
    return this._portalUrl;
  }

  constructor() {}

  init(): Promise<void> {
    return new Promise((resolve) => {
      this.setEnvVariables();
      resolve();
    });
  }

  private setEnvVariables(): void {
    const hostname = window && window.location && window.location.hostname;
    const pathname = window && window.location && window.location.pathname;

    if (/^localhost/.test(hostname)) {
      this._env = EnvironmentType.Local;
      this._apiUrl = this.getApiUrl(environment.backend);
      this._portalUrl = this.getPortalUrl(environment.backend);
      this._hazmapperUrl = this.getHazmapperUrl(environment.backend);
      // when we are using the local backend, a jwt is required
      if (environment.backend === EnvironmentType.Local) {
        this._jwt = environment.jwt;
      }
      this._baseHref = '/';
      this._clientId = 'taggit.localhost';
    } else if (/^hazmapper.tacc.utexas.edu/.test(hostname) && pathname.startsWith('/taggit-exp')) {
      this._env = EnvironmentType.Experimental;
      this._apiUrl = this.getApiUrl(this.env);
      this._portalUrl = this.getPortalUrl(this.env);
      this._hazmapperUrl = this.getHazmapperUrl(this.env);
      this._clientId = 'taggit.experimental';
      this._baseHref = '/taggit-dev/';
    } else if (/^hazmapper.tacc.utexas.edu/.test(hostname) && pathname.startsWith('/taggit-dev')) {
      this._env = EnvironmentType.Dev;
      this._apiUrl = this.getApiUrl(this.env);
      this._portalUrl = this.getPortalUrl(this.env);
      this._hazmapperUrl = this.getHazmapperUrl(this.env);
      this._clientId = 'taggit.dev';
      this._baseHref = '/taggit-dev/';
    } else if (/^hazmapper.tacc.utexas.edu/.test(hostname) && pathname.startsWith('/taggit-staging')) {
      this._env = EnvironmentType.Staging;
      this._apiUrl = this.getApiUrl(this.env);
      this._portalUrl = this.getPortalUrl(this.env);
      this._hazmapperUrl = this.getHazmapperUrl(this.env);
      this._clientId = 'taggit.staging';
      this._baseHref = '/taggit-staging/';
    } else if (/^hazmapper.tacc.utexas.edu/.test(hostname)) {
      this._env = EnvironmentType.Production;
      this._apiUrl = this.getApiUrl(this.env);
      this._portalUrl = this.getPortalUrl(this.env);
      this._hazmapperUrl = this.getHazmapperUrl(this.env);
      this._clientId = 'taggit.prod';
      this._baseHref = '/taggit/';
    } else if (/^taggit-tacc.github.io/.test(hostname)) {
      this._env = EnvironmentType.Production;
      this._apiUrl = this.getApiUrl(this.env);
      this._portalUrl = this.getPortalUrl(this.env);
      this._hazmapperUrl = this.getHazmapperUrl(this.env);
      this._clientId = 'jHXnvsmQQcmP43qlrG7ATaxFXHQa';
      this._baseHref = '/';
    } else {
      console.error('Cannot find environment for host name ${hostname}');
    }
  }
}
