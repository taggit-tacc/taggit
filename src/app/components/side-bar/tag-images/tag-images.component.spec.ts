import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TagImagesComponent } from './tag-images.component';

describe('TagImagesComponent', () => {
  let component: TagImagesComponent;
  let fixture: ComponentFixture<TagImagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TagImagesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TagImagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
