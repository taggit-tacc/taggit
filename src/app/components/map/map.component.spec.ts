import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapComponent } from './map.component';
import {GeoDataService} from '../../services/geo-data.service';
import {instance, mock, spy, when} from 'ts-mockito';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {of} from 'rxjs';
import {featureFixture} from '../../fixtures/feature.fixture';
import {overlayFixture} from '../../fixtures/overlay.fixture';
import {FeatureCollection} from '../../models/models';

class MockActivatedRoute extends ActivatedRoute {
  constructor() {
    super();
    this.queryParams = of({mapType: '5'});
  }
}

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  const MockData: GeoDataService = mock(GeoDataService);
  const MockActive: ActivatedRoute = mock(ActivatedRoute);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapComponent ],
      providers: [
        {
          provide: GeoDataService, useFactory: () => instance(MockData)
        },
        {
          provide: ActivatedRoute, useClass: MockActivatedRoute
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;

    when(MockData.activeOverlay).thenReturn(of(overlayFixture));
    when(MockData.activeFeature).thenReturn(of(featureFixture));
    when(MockData.features).thenReturn(of(new FeatureCollection()));
    when(MockData.basemap).thenReturn(of('roads'));
    spyOn(component, 'loadFeatures').and.returnValue(null);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
