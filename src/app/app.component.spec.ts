import {TestBed, async, ComponentFixture} from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import {AuthService} from "./services/authentication.service";


class MockAuth {
  setToken(){}
  getUserInfo(){}
  login(){}
}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let authMock: jasmine.SpyObj<AuthService>;
  let element: HTMLElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        {
          provide: AuthService, useClass: MockAuth
        }
      ]
    }).compileComponents();
  }));

  beforeEach(()=>{
    fixture = TestBed.createComponent(AppComponent);
    authMock = TestBed.get(AuthService);
    spyOn(authMock, 'login')
  });

  it('should create the app', () => {
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'viewer'`, () => {
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('viewer');
  });


});
