import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CallbackComponent } from './callback.component';
import {AuthService} from "../../services/authentication.service";
import {GeoDataService} from "../../services/geo-data.service";
import {ActivatedRoute, Router} from "@angular/router";
import {Test} from "tslint";

class MockAuth {
  setToken(){}
  getUserInfo(){}
}
class MockRouter {
  navigate(){}
}
class MockActivatedRoute {
  snapshot: object;
  constructor(){
    this.snapshot={
      get fragment() {return "123"}
    }
  }
}

describe('CallbackComponent', () => {
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;
  let authMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;
  let activeRouteMock: jasmine.SpyObj<ActivatedRoute>;
  let element: HTMLElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CallbackComponent ],
      providers: [ {
        provide: AuthService,
        useClass: MockAuth
      }, {
        provide: Router,
        useClass: MockRouter
      },{
        provide: ActivatedRoute,
        useClass: MockActivatedRoute
      }]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
    authMock = TestBed.get(AuthService);
    routerMock = TestBed.get(Router);
    activeRouteMock = TestBed.get(ActivatedRoute);
    spyOnProperty(activeRouteMock.snapshot, 'fragment').and.returnValue("#access_token=qadad&expires_in=3600");
    spyOn(authMock, 'setToken');
    spyOn(routerMock, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
