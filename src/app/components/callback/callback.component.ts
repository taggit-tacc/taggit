import { Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Route } from '@angular/router';
import { AuthService } from '../../services/authentication.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss'],
})
export class CallbackComponent implements OnInit {
  constructor(private route: ActivatedRoute, private auth: AuthService) {}

  ngOnInit() {
    const fragment = this.route.snapshot.fragment;
    if (fragment) {
      const params = new URLSearchParams(fragment);
      const token = params.get('access_token');
      const expires_in = Number(params.get('expires_in'));
      this.auth.setToken(token, expires_in);
    } else {
      // TODO REMOVE
      const token = this.route.snapshot.queryParams.access_token;
      const expires_in = this.route.snapshot.queryParams.expires_in;
      this.auth.setToken(token, expires_in);
    }
  }
}
