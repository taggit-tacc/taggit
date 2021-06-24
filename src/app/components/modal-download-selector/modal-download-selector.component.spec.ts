import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDownloadSelectorComponent } from './modal-download-selector.component';

describe('ModalDownloadSelectorComponent', () => {
  let component: ModalDownloadSelectorComponent;
  let fixture: ComponentFixture<ModalDownloadSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalDownloadSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalDownloadSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
