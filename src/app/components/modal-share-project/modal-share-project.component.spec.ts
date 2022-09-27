import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalShareProjectComponent } from './modal-share-project.component';

describe('ModalShareProjectComponent', () => {
  let component: ModalShareProjectComponent;
  let fixture: ComponentFixture<ModalShareProjectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ModalShareProjectComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalShareProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
