import { Injectable, NgModule } from '@angular/core';
import {
  Routes,
  RouterModule,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { NotFoundComponent } from './components/notfound/notfound.component';
import { AuthService } from './services/authentication.service';
import { MainComponent } from './components/main/main.component';
import { CallbackComponent } from './components/callback/callback.component';
import { MainWelcomeComponent } from './components/main-welcome/main-welcome.component';

@Injectable()
export class Activate implements CanActivate {
  constructor(private authSvc: AuthService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authSvc.isLoggedIn()) {
      return true;
    }
    this.authSvc.login();
  }
}

const routes: Routes = [
  { path: 'project-public/:projectUUID', component: MainComponent },
  {
    path: 'project/:projectUUID',
    component: MainComponent,
    canActivate: [Activate]
  },
  { path: 'callback', component: CallbackComponent },
  { path: '404', component: NotFoundComponent },
  {
    path: '',
    pathMatch: 'full',
    component: MainWelcomeComponent,
    canActivate: [Activate],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule],
  providers: [Activate],
})
export class AppRoutingModule {}
