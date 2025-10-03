import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { EnvService } from './services/env.service';
import { AuthService } from './services/authentication.service';
import { catchError } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(
    private authSvc: AuthService,
    private envService: EnvService,
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const headers: { [key: string]: string } = {};

    if (request.url.includes(this.envService.tapisUrl) ||
    request.url.includes(this.envService.apiUrl) ||
    request.url.includes(this.envService.designSafePortalUrl)) {
      if (this.authSvc.isLoggedInButTokenExpired()) {
        this.authSvc.logout();
        location.reload();
      }

      if (this.authSvc.isLoggedIn()) {
        headers['X-Tapis-Token'] = this.authSvc.userToken.token;
      }
    }

    if (request.url.includes(this.envService.apiUrl)) {
      // Add information about what app is making the request
      headers['X-Geoapi-Application'] = 'taggit';
      headers['X-Geoapi-IsPublicView'] = 'True'; // Todo: update for public-view in https://tacc-main.atlassian.net/browse/WG-127

      // for guest users, add a unique id
      if (!this.authSvc.isLoggedIn()) {
        // Get (or create if needed) the guestUserID in local storage
        let guestUuid = localStorage.getItem('guestUuid');

        if (!guestUuid) {
          guestUuid = uuidv4();
          localStorage.setItem('guestUuid', guestUuid);
        }
        headers['X-Guest-UUID'] = guestUuid;
      }

      // Include credentials for CORS requests to the API
      request = request.clone({ withCredentials: true });
    }

    // Apply headers if there are any to set
    if (Object.keys(headers).length > 0) {
      request = request.clone({ setHeaders: headers });
    }

    return next.handle(request);
  }

  /**
   * Determines whether a given HTTP request targets the features endpoint of a project or public project.
   *
   * This endpoint is being logged with extra information for analytics purposes.
   */
  private isProjectFeaturesRequest(request: HttpRequest<any>): boolean {
    // Regular expression to match /projects/{projectId}/features or /public-projects/{projectId}/features
    const urlPattern = /\/(projects|public-projects)\/\d+\/features\/?(?:\?.*)?/;
    return request.method === 'GET' && urlPattern.test(request.url);
  }
}
