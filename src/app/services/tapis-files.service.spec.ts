import { TestBed } from '@angular/core/testing';

import { TapisFilesService } from './tapis-files.service';
import {AgaveSystemsService} from "./agave-systems.service";
import {HttpClientTestingModule} from "@angular/common/http/testing";

describe('AgaveFilesService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [TapisFilesService],
    imports: [
      HttpClientTestingModule
    ]
  }));

  it('should be created', () => {
    const service: TapisFilesService = TestBed.get(TapisFilesService);
    expect(service).toBeTruthy();
  });
});
