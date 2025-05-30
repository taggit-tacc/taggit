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
import { TagGeneratorComponent } from './components/side-bar/tag-generator/tag-generator.component';
import { TagImagesComponent } from './components/side-bar/tag-images/tag-images.component';

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
    debugger;
    this.authSvc.login();
  }
}

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    canActivate: [Activate],
    children: [
      {
        path: 'tagger',
        component: TagImagesComponent,
        canActivateChild: [Activate],
      },
      {
        path: 'preset',
        component: TagGeneratorComponent,
        canActivateChild: [Activate],
      },
    ],
  },
  { path: 'callback', component: CallbackComponent },
  { path: '404', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule],
  providers: [Activate],
})
export class AppRoutingModule {}
