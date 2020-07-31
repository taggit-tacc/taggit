import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MainComponent } from './main.component';
import {GeoDataService} from '../../services/geo-data.service';
import {instance, mock, when} from 'ts-mockito';
import {AuthService} from '../../services/authentication.service';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {of} from 'rxjs';
import {FeatureCollection} from '../../models/models';


describe('MainComponent', () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;
  const MockData: GeoDataService = mock(GeoDataService);
  const MockAuth: AuthService = mock(AuthService);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MainComponent ],
      providers: [
        {
          provide: GeoDataService, useFactory: () => instance(MockData)
        },
        {
          provide: AuthService, useFactory: () => instance(MockAuth)
        }
      ], schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
