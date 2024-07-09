import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthToken } from '../models/models';
import { EnvService } from '../services/env.service';
import { Observable, ReplaySubject } from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

export class AuthenticatedUser {
  public readonly username: string;
  public readonly email: string;
  private _token: AuthToken;

  constructor(username: string) {
    this.username = username;
  }
}

interface OpenIDUser {
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentUser: ReplaySubject<AuthenticatedUser> =
    new ReplaySubject<AuthenticatedUser>(1);
  public readonly currentUser: Observable<AuthenticatedUser> =
    this._currentUser.asObservable();
  userToken: AuthToken;

  constructor(private http: HttpClient, private router: Router, private envService: EnvService) {}

  public getTokenKeyword() {
    return `${this.envService.env}V3TaggitToken`;
  }

  public getUserKeyword() {
    return `${this.envService.env}V3TaggitUser`;
  }

  public login() {
    // First, check if the user has a token in localStorage
    const tokenStr = localStorage.getItem(this.getTokenKeyword());
    if (!tokenStr) {
      this.redirectToauthenticaor();
    } else {
      const token = JSON.parse(tokenStr);
      this.userToken = new AuthToken(token.token, new Date(token.expires));
      if (!this.userToken || this.userToken.isExpired()) {
        this.logout();
        this.redirectToauthenticaor();
      }
      this.getUserInfoFromToken();
    }
  }

  private redirectToauthenticaor() {
    const client_id = this.envService.clientId;
    const callbackSlash = this.envService.env === 'production' || this.envService.env === 'staging' ? 'callback/' : 'callback';
    const callback = location.origin + this.envService.baseHref + callbackSlash;
    const state = Math.random().toString(36);
    const AUTH_URL_V3 = `${this.envService.tapisUrl}/v3/oauth2/authorize?client_id=${client_id}&response_type=token&redirect_uri=${callback}`;
    window.location.href = AUTH_URL_V3;
  }

  /**
   * Checks to make sure that the user has a token and the token is not expired;
   */
  public isLoggedIn(): boolean {
    const tokenStr = localStorage.getItem(this.getTokenKeyword());
    if (tokenStr) {
      const token = JSON.parse(tokenStr);
      this.userToken = new AuthToken(token.token, new Date(token.expires));
      return this.userToken && !this.userToken.isExpired();
    }
    return false;
  }

  /**
   * Checks to see if there is a logged in user but token is expired;
   */
  public isLoggedInButTokenExpired(): boolean {
    const tokenStr = localStorage.getItem(this.getTokenKeyword());
    if (tokenStr) {
      const token = JSON.parse(tokenStr);
      this.userToken = new AuthToken(token.token, new Date(token.expires));
      return this.userToken && this.userToken.isExpired();
    }
    return false;
  }

  public logout(): void {
    this.userToken = null;
    localStorage.removeItem(this.getTokenKeyword());
    localStorage.removeItem(this.getUserKeyword());
  }

  public setToken(token: string, expires: number): void {
    this.userToken = AuthToken.fromExpiresIn(token, expires);
    localStorage.setItem(this.getTokenKeyword(), JSON.stringify(this.userToken));
    this.getUserInfoFromToken();
    // hit the wso2 api to retrieve the username etc
    this.router.navigate(['/']);
  }

  public getUserInfoFromToken() {
    // tapis/username
    const decodedJwt = jwtDecode(this.userToken.token);
    const u = new AuthenticatedUser(decodedJwt['tapis/username']);
    this._currentUser.next(u);
  }
}
