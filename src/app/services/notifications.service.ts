import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { EnvService } from './env.service';
import { HttpClient } from '@angular/common/http';
import { INotification } from '../models/notification';
import { interval, Observable, ReplaySubject } from 'rxjs';
import { AuthService } from '../services/authentication.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  // Interval time to get notifications in millisecs
  private TIMEOUT = 5000;
  private _notifications: ReplaySubject<Array<INotification>> =
    new ReplaySubject<Array<INotification>>(1);
  public readonly notifications: Observable<Array<INotification>> =
    this._notifications.asObservable();

  constructor(
    private toastr: ToastrService,
    private http: HttpClient,
    private authService: AuthService,
    private envService: EnvService
  ) {
    if (this.authService.isLoggedIn()) {
      const timer = interval(this.TIMEOUT);
      timer.subscribe((next) => {
        this.getRecent();
      });
    }
  }

  // Sends a request to GeoAPI to retrieve recent notifications
  getRecent(): void {
    const baseUrl = this.envService.apiUrl + '/notifications/';
    const now = new Date();
    const then = new Date(now.getTime() - this.TIMEOUT);

    this.http
      .get<Array<INotification>>(baseUrl + `?startDate=${then.toISOString()}`)
      .subscribe((notes) => {
        this._notifications.next(notes);
        notes.forEach((note) => {
          switch (note.status) {
            case 'success':
              this.showSuccessToast(note.message);
              break;
            case 'error':
              this.showErrorToast(note.message);
              break;
            default:
              break;
          }
        });
      });
  }

  showSuccessToast(message: string): void {
    this.toastr.success(message);
  }

  showImportErrorToast(message: string): void {
    this.toastr.error(message + ', trying alternate method');
  }

  showErrorToast(message: string): void {
    this.toastr.error(message);
  }
}
