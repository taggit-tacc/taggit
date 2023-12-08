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
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((err) => {
        if (err.status === 401) {
          // auto logout if 401 response returned from api
          // https://jira.tacc.utexas.edu/browse/DES-1999
          this.authService.logout();
          location.reload();
        }

        const error = err.error.message || err.statusText;
        return throwError(error);
      })
    );
  }
}

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
    if (request.url.indexOf('https://agave.designsafe-ci.org') > -1) {
      if (this.authSvc.isLoggedIn()) {
        request = request.clone({
          setHeaders: {
            Authorization: 'Bearer ' + this.authSvc.userToken.token,
          },
        });
      }
    }
    // we put the JWT on the request to our geoapi API because it is not behind ws02 if in local dev
    // and if user is logged in
    if (this.envService.jwt && request.url.indexOf(this.envService.apiUrl) > -1 && this.authSvc.isLoggedIn()) {
      // add header
      request = request.clone({
        setHeaders: {
          'X-JWT-Assertion-designsafe': this.envService.jwt,
        },
      });
    }

    if (request.url.indexOf(this.envService.apiUrl) > -1) {
      // Add information about what app is making the request

      // Disabling custom headers due to https://tacc-main.atlassian.net/browse/WG-191
      // and using additional query params
      let analytics_params = {};

      /*request = request.clone({
        setHeaders: {
          'X-Geoapi-Application': 'hazmapper',
        },
      });*/

      analytics_params = { ...analytics_params, application: 'hazmapper' };

      // for guest users, add a unique id
      if (!this.authSvc.isLoggedIn()) {
        // Get (or create of needed) the guestUserID in local storage
        let guestUuid = localStorage.getItem('guestUuid');

        if (!guestUuid) {
          guestUuid = uuidv4();
          localStorage.setItem('guestUuid', guestUuid);
        }
        /*Disabling custom headers due to https://tacc-main.atlassian.net/browse/WG-191
        request = request.clone({
          setHeaders: {
            'X-Guest-UUID': guestUuid,
          },
        });
        */
        analytics_params = { ...analytics_params, guest_uuid: guestUuid };
      }
      /* Send analytics-related params to projects endpoint only (until we use headers
        again in https://tacc-main.atlassian.net/browse/WG-192) */
      if (this.isProjectFeaturesRequest(request)) {
        // Clone the request and add query parameters
        request = request.clone({
          setParams: { ...request.params, ...analytics_params },
        });
      }
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
