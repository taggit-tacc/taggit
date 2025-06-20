import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/authentication.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss'],
})
export class CallbackComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router, private auth: AuthService) {}

  ngOnInit() {
    const fragment = this.route.snapshot.fragment;
      const redirectTo = '/';
      const params = new URLSearchParams(fragment);
      const token = params.get('access_token');
      const expires_in = Number(params.get('expires_in'));
      this.auth.setToken(token, expires_in);
      this.router.navigate([redirectTo]);
  }
}
