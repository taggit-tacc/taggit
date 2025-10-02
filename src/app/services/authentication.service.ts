import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthToken } from '../models/models';
import { EnvService } from '../services/env.service';
import { Observable, ReplaySubject } from 'rxjs';

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
    // First, try to get user object from backend
    this.getAuthenticatedUser();
    // If no user object, redirect to authenticator
    if (!this.isLoggedIn()) this.redirectToAuthenticator();
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
  public getAuthenticatedUser(): void {
    this.http.get(this.envService.apiUrl + '/auth/user/').subscribe(
      (resp: TAuthenticatedUserResponse) => {
        this.userToken = new AuthToken(
          resp.authToken.token,
          resp.authToken.expiresAt
        );
        const u = new AuthenticatedUser(resp.username);
        this._currentUser.next(u);
      },
      (error) => {
        console.error(error);
      }
    );
  }
}
