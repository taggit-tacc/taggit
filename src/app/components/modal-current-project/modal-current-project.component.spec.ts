import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCurrentProjectComponent } from './modal-current-project.component';

describe('ModalCurrentProjectComponentComponent', () => {
  let component: ModalCurrentProjectComponent;
  let fixture: ComponentFixture<ModalCurrentProjectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ModalCurrentProjectComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalCurrentProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
