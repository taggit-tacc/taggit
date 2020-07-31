import { Component, OnInit, OnDestroy, TemplateRef} from '@angular/core';
import { GroupsService } from '../../../services/groups.service';
import { FormsService } from '../../../services/forms.service';
import { MatDialog } from '@angular/material/dialog';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tag-images',
  templateUrl: './tag-images.component.html',
  styleUrls: ['./tag-images.component.scss']
})
export class TagImagesComponent implements OnInit {
  activeGroup: string;
  payload: any;
  selectedGroup: string;
  openOption: any = {};
  activeFeatureId: number;
  private formGroup$: Subscription;
  private activeGroup$: Subscription;
  private activeFeatureId$: Subscription;
  form: FormGroup;
  showSubitem: boolean = true;

  constructor(
	private groupsService: GroupsService,
	private formsService: FormsService,
	private dialog: MatDialog,
	private router: Router) { }

  ngOnInit() {
	this.activeGroup$ = this.activeGroup$ = this.groupsService.activeGroup.subscribe((next) => {
	  this.activeGroup = next;
	});

	this.activeFeatureId$ = this.groupsService.activeFeatureId.subscribe((next) => {
	  this.activeFeatureId = next;
	});

	this.formGroup$ = this.formsService.formGroup.subscribe((next) => {
	  this.form = next;
	});
  }

  openRenameModal(template: TemplateRef<any>, name: string) {
	this.selectedGroup = name;
	this.dialog.open(template);
  }

  openRenameOptionModal(template: TemplateRef<any>) {
	this.dialog.open(template);
  }

  openOptionToggle(label: string) {
	if (this.openOption[label]) {
	  this.openOption[label] = false;
	} else {
	  this.openOption[label] = true;
	}
  }

  createNewTag() {
	  this.groupsService.setActivePane("preset");
	  this.router.navigateByUrl('/preset', {skipLocationChange: true});
  }

  onSubmit() {
	this.payload = this.form.getRawValue();
	console.log(this.payload);
	this.groupsService.setTagFeatureGroup(this.activeGroup, this.activeFeatureId, this.payload);
  }

  ngOnDestroy() {
	this.formGroup$.unsubscribe();
	this.activeFeatureId$.unsubscribe();
	this.activeGroup$.unsubscribe();
  }

  expandPanel() {
	this.showSubitem = !this.showSubitem;
	if (this.showSubitem) {

	} else {
	}
  }
}
