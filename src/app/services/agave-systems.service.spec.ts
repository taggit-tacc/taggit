import { TestBed } from '@angular/core/testing';

import { AgaveSystemsService } from './agave-systems.service';
import {HttpClientTestingModule} from "@angular/common/http/testing";

describe('AgaveSystemsService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [AgaveSystemsService],
    imports: [
      HttpClientTestingModule
    ]
  }));

  it('should be created', () => {
    const service: AgaveSystemsService = TestBed.get(AgaveSystemsService);
    expect(service).toBeTruthy();
  });
});
