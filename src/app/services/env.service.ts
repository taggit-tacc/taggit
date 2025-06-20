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
  private _baseHref: string;
  private _hazmapperUrl: string;

  /**
   * Retrieves the base hostname for the Hazmapper deployment.
   */
  private getHazmapperBase(): string {
    const host = window.location.hostname;

    // TODO https://tacc-main.atlassian.net/browse/WG-513 remove/refactor this method
    if (host.includes('hazmapper-tmp.tacc.utexas.edu')) {
      return 'hazmapper-tmp.tacc.utexas.edu';
    }

    return 'hazmapper.tacc.utexas.edu'; // default
  }

  private getHazmapperUrl(backend: EnvironmentType): string {
    const base = this.getHazmapperBase();

    if (backend === EnvironmentType.Local) {
      return 'http://localhost:4200/';
    } else if (backend === EnvironmentType.Staging) {
      return `https://${base}/staging`;
    } else if (backend === EnvironmentType.Dev) {
      return `https://${base}/dev`;
    } else if (backend === EnvironmentType.Production) {
      return `https://${base}/hazmapper`;
    } else {
      throw new Error('Unsupported Type');
    }
  }

  private getApiUrl(backend: EnvironmentType): string {
    const base = this.getHazmapperBase();

    if (backend === EnvironmentType.Local) {
      return 'http://localhost:8888';
    } else if (backend === EnvironmentType.Staging) {
      return `https://${base}/geoapi-staging`;
    } else if (backend === EnvironmentType.Production) {
      return `https://${base}/geoapi`;
    } else if (backend === EnvironmentType.Dev) {
      return `https://${base}/geoapi-dev`;
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
    } else {
      return 'https://pprd.designsafe-ci.org';
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
    const hazmapperBase = this.getHazmapperBase();

    if (/^localhost/.test(hostname)) {
      this._env = EnvironmentType.Local;
      this._apiUrl = this.getApiUrl(environment.backend);
      this._designSafePortalUrl = this.getDesignSafePortalUrl(environment.backend);
      this._hazmapperUrl = this.getHazmapperUrl(environment.backend);
      this._baseHref = '/';
    } else if (hostname == hazmapperBase && pathname.startsWith('/taggit-dev')) {
      this._env = EnvironmentType.Dev;
      this._apiUrl = this.getApiUrl(this.env);
      this._designSafePortalUrl = this.getDesignSafePortalUrl(this.env);
      this._hazmapperUrl = this.getHazmapperUrl(this.env);
      this._baseHref = '/taggit-dev/';
    } else if (hostname == hazmapperBase && pathname.startsWith('/taggit-staging')) {
      this._env = EnvironmentType.Staging;
      this._apiUrl = this.getApiUrl(this.env);
      this._designSafePortalUrl = this.getDesignSafePortalUrl(this.env);
      this._hazmapperUrl = this.getHazmapperUrl(this.env);
      this._baseHref = '/taggit-staging/';
    } else if (hostname == hazmapperBase && pathname.startsWith('/taggit')) {
      this._env = EnvironmentType.Production;
      this._apiUrl = this.getApiUrl(this.env);
      this._designSafePortalUrl = this.getDesignSafePortalUrl(this.env);
      this._hazmapperUrl = this.getHazmapperUrl(this.env);
      this._baseHref = '/taggit/';
    } else {
      console.error('Cannot find environment for host name ${hostname}');
    }
  }
}
