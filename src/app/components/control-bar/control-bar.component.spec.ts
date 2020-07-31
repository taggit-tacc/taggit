import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {instance, mock, when} from "ts-mockito";
import { ControlBarComponent } from './control-bar.component';
import {ProjectsService} from "../../services/projects.service";
import {GeoDataService} from "../../services/geo-data.service";
import {BsModalService} from "ngx-foundation";

describe('ControlBarComponent', () => {
  let component: ControlBarComponent;
  let fixture: ComponentFixture<ControlBarComponent>;
  const MockProjects: ProjectsService = mock(ProjectsService);
  const MockData: GeoDataService = mock(GeoDataService);
  const MockModal: BsModalService = mock(BsModalService);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ControlBarComponent ],
      providers: [
        {
          provide: ProjectsService, useValue: instance(MockProjects)
        },
        {
          provide: GeoDataService, useValue: instance(MockData)
        },
        {
          provide: BsModalService, useValue: instance(MockModal)
        }

      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlBarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
