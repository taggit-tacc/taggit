import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCreateProjectComponent } from './modal-create-project.component';

describe('ModalCreateProjectComponent', () => {
  let component: ModalCreateProjectComponent;
  let fixture: ComponentFixture<ModalCreateProjectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalCreateProjectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalCreateProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
