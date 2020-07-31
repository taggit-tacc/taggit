import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TagGeneratorComponent } from './tag-generator.component';

describe('TagGeneratorComponent', () => {
  let component: TagGeneratorComponent;
  let fixture: ComponentFixture<TagGeneratorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TagGeneratorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TagGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
