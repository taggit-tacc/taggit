import {Component, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute, Router, Route} from '@angular/router';
import {AuthService} from '../../services/authentication.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss']
})
export class CallbackComponent implements OnInit {

  constructor(private route: ActivatedRoute, private auth: AuthService) { }

  ngOnInit() {
	// TODO: For some reason wso2 is sending back a fragment like #access_token=qadad&expires_in=3600
	const frag = this.route.snapshot.fragment;
	const params = new URLSearchParams(frag);
	const token = params.get('access_token');
	const expires_in = +params.get('expires_in');
	this.auth.setToken(token, expires_in);
  }

}
