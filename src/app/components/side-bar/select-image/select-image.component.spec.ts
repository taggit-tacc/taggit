import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectImageComponent } from './select-image.component';

describe('SelectImageComponent', () => {
  let component: SelectImageComponent;
  let fixture: ComponentFixture<SelectImageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectImageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
