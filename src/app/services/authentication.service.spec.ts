import { TestBed } from '@angular/core/testing';

import { AuthService } from './authentication.service';
import {HttpClientTestingModule} from "@angular/common/http/testing";

describe('AuthenticationService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [AuthService],
    imports: [
      HttpClientTestingModule
    ]
  }));

  it('should be created', () => {
    const service: AuthService = TestBed.get(AuthService);
    expect(service).toBeTruthy();
  });
});
