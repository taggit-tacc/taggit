import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { EnvironmentType } from '../../environments/environmentType';

@Injectable({
  providedIn: 'root'
})
export class EnvService {
  private _env: EnvironmentType;
  private _apiUrl: string;
  private _designSafePortalUrl: string;
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
    } else if (backend === EnvironmentType.Production) {
      return 'https://hazmapper.tacc.utexas.edu/hazmapper';
    } else if (backend === EnvironmentType.Experimental) {
      return 'https://hazmapper.tacc.utexas.edu/exp';
    } else {
      throw new Error('Unsupported Type');
    }
  }

  private getApiUrl(backend: EnvironmentType): string {
    if (backend === EnvironmentType.Local) {
      return 'http://localhost:8888';
    } else if (backend === EnvironmentType.Staging) {
      return 'https://hazmapper.tacc.utexas.edu/geoapi-staging';
    } else if (backend === EnvironmentType.Production) {
      return 'https://hazmapper.tacc.utexas.edu/geoapi';
    } else if (backend === EnvironmentType.Dev) {
      return 'https://hazmapper.tacc.utexas.edu/geoapi-dev';
    } else if (backend === EnvironmentType.Experimental) {
      return 'https://hazmapper.tacc.utexas.edu/geoapi-experimental';
    } else {
      throw new Error('Unsupported Type');
    }
  }

  get tapisUrl(): string {
    return 'https://designsafe.tapis.io';
  }

  private getDesignSafePortalUrl(backend: EnvironmentType): string {
    if (backend === EnvironmentType.Production) {
      return 'https://www.designsafe-ci.org';
    } else if (backend === EnvironmentType.Experimental || backend === EnvironmentType.Local) {
      return 'https://designsafeci-next.tacc.utexas.edu';
    } else {
      return 'https://designsafeci-dev.tacc.utexas.edu';
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

  get clientId(): string {
    return this._clientId;
  }

  get baseHref(): string {
    return this._baseHref;
  }

  get hazmapperUrl(): string {
    return this._hazmapperUrl;
  }

  get designSafePortalUrl(): string {
    return this._designSafePortalUrl;
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
      this._designSafePortalUrl = this.getDesignSafePortalUrl(environment.backend);
      this._hazmapperUrl = this.getHazmapperUrl(environment.backend);
      this._baseHref = '/';
      this._clientId = 'taggitds.localhost';
    } else if (/^hazmapper.tacc.utexas.edu/.test(hostname) && pathname.startsWith('/taggit-dev')) {
      this._env = EnvironmentType.Dev;
      this._apiUrl = this.getApiUrl(this.env);
      this._designSafePortalUrl = this.getDesignSafePortalUrl(this.env);
      this._hazmapperUrl = this.getHazmapperUrl(this.env);
      this._clientId = 'taggitds.dev';
      this._baseHref = '/taggit-dev/';
    } else if (/^hazmapper.tacc.utexas.edu/.test(hostname) && pathname.startsWith('/taggit-exp')) {
      this._env = EnvironmentType.Experimental;
      this._apiUrl = this.getApiUrl(this.env);
      this._hazmapperUrl = this.getHazmapperUrl(this.env);
      this._designSafePortalUrl = this.getDesignSafePortalUrl(this.env);
      this._clientId = 'taggitds.experimental';
      this._baseHref = '/taggit-exp/';
    } else if (/^hazmapper.tacc.utexas.edu/.test(hostname) && pathname.startsWith('/taggit-staging')) {
      this._env = EnvironmentType.Staging;
      this._apiUrl = this.getApiUrl(this.env);
      this._designSafePortalUrl = this.getDesignSafePortalUrl(this.env);
      this._hazmapperUrl = this.getHazmapperUrl(this.env);
      this._clientId = 'taggitds.staging';
      this._baseHref = '/taggit-staging/';
    } else if (/^hazmapper.tacc.utexas.edu/.test(hostname)) {
      this._env = EnvironmentType.Production;
      this._apiUrl = this.getApiUrl(this.env);
      this._designSafePortalUrl = this.getDesignSafePortalUrl(this.env);
      this._hazmapperUrl = this.getHazmapperUrl(this.env);
      this._clientId = 'taggitds.prod';
      this._baseHref = '/taggit/';
    } else if (/^taggit-tacc.github.io/.test(hostname)) {
      this._env = EnvironmentType.Production;
      this._apiUrl = this.getApiUrl(this.env);
      this._designSafePortalUrl = this.getDesignSafePortalUrl(this.env);
      this._hazmapperUrl = this.getHazmapperUrl(this.env);
      this._clientId = 'jHXnvsmQQcmP43qlrG7ATaxFXHQa'; // Need to update or delete the clientId to match convention
      this._baseHref = '/';
    } else {
      console.error('Cannot find environment for host name ${hostname}');
    }
  }
}
