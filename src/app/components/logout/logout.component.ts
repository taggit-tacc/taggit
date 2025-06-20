import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/authentication.service';
@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutComponent implements OnInit {

  constructor(private authService: AuthService) { }

  ngOnInit() {
      this.authService.logout();
  }

}
