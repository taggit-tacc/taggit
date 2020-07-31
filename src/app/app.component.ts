import {Component, OnInit} from '@angular/core';
import {AuthService} from './services/authentication.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'viewer';

  constructor(private authService: AuthService) {}

  ngOnInit() {
	this.authService.login();
  }
}
