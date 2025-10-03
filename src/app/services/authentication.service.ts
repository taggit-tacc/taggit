import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthToken } from '../models/models';
import { EnvService } from '../services/env.service';
import { Observable, ReplaySubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

export class AuthenticatedUser {
  public readonly username: string;
  public readonly email: string;
  private _token: AuthToken;

  constructor(username: string) {
    this.username = username;
  }
}

interface TAuthenticatedUserResponse {
  username: string | null;
  authToken: {
    token: string;
    expiresAt: Date;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentUser: ReplaySubject<AuthenticatedUser> =
    new ReplaySubject<AuthenticatedUser>(1);
  public readonly currentUser: Observable<AuthenticatedUser> =
    this._currentUser.asObservable();
  userToken: AuthToken;

  constructor(private http: HttpClient, private envService: EnvService) {}

  public getTokenKeyword() {
    return `${this.envService.env}V3TaggitToken`;
  }

  public getUserKeyword() {
    return `${this.envService.env}V3TaggitUser`;
  }

  public login() {

    // Get user object from backend and see if that works
    this.getAuthenticatedUser().subscribe({
      next: (user) => {
        // User is authenticated, no redirect needed
        console.log('User authenticated:', user);
      },
      error: () => {
        // No authenticated user, redirect to authenticator
        this.redirectToAuthenticator();
      }
    });
  }

  private redirectToAuthenticator(to: string = '/') {
    const geoapi_auth_url = `${
      this.envService.apiUrl
    }/auth/login?to=${encodeURIComponent(to)}`;
    window.location.href = geoapi_auth_url;
  }

  /**
   * Checks to make sure that the user has a token and the token is not expired;
   */
  public isLoggedIn(): boolean {
    return this.userToken && !this.userToken.isExpired();
  }

  /**
   * Checks to see if there is a logged in user but token is expired;
   */
  public isLoggedInButTokenExpired(): boolean {
    return this.userToken && this.userToken.isExpired();
  }

  public logout(): void {
    this.userToken = null;
    this._currentUser.next(null);
  }


  // Get the authenticated user object from the backend
  // Now returns an Observable so callers can react to the response
  public getAuthenticatedUser(): Observable<AuthenticatedUser> {
    return this.http.get<TAuthenticatedUserResponse>(
      this.envService.apiUrl + '/auth/user/'
    ).pipe(
      tap((resp: TAuthenticatedUserResponse) => {
        this.userToken = new AuthToken(
          resp.authToken.token,
          resp.authToken.expiresAt
        );
      }),
      map((resp) => {
        const u = new AuthenticatedUser(resp.username);
        this._currentUser.next(u);
        return u;
      }),
      catchError((error) => {
        console.error('Failed to get authenticated user:', error);
        return throwError(() => error);
      })
    );
  }
}
