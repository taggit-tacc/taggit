import { Component, OnInit, OnDestroy, TemplateRef} from '@angular/core';
import { FormsService } from '../../../services/forms.service';
import { GroupsService } from '../../../services/groups.service';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-select-group',
  templateUrl: './select-group.component.html',
  styleUrls: ['./select-group.component.scss']
})
export class SelectGroupComponent implements OnInit, OnDestroy {
  groups$: Subscription;
  activeGroup$: Subscription;

  selectedGroup: string;
  groupList: Array<any>;
  showSidebar: boolean
  activeGroup: string;
  showSubitem: boolean = true;

  constructor(private formsService: FormsService,
			  private groupsService: GroupsService,
			  private dialog: MatDialog) { }

  ngOnInit() {
	this.groups$ = this.groupsService.groups.subscribe((next) => {
	  this.groupList = next;
	});

	this.activeGroup$ = this.groupsService.activeGroup.subscribe((next) => {
	  this.activeGroup = next;
	});
  }

  selectGroupForm(group: string) {
	this.groupsService.setActiveGroup(group);
	this.groupsService.setActiveFeatureNum(0);
	this.formsService.changeGroupForm(group);
  }

  openRenameOptionModal(template: TemplateRef<any>) {
	this.dialog.open(template);
  }

  deleteGroup() {
	this.groupsService.addGroup(this.groupList.filter(what => what.name != this.activeGroup))
	if (this.groupList.length <= 0) {
	  this.showSidebar = false;
	  this.groupsService.setShowSidebar(this.showSidebar);
	} else {
	  this.groupsService.setActiveGroup(this.groupList[0].name);
	}
  }

  openRenameModal(template: TemplateRef<any>, name: string) {
	this.selectedGroup = name;
	this.dialog.open(template);
  }

  isChecked(name: string) {
	if (this.activeGroup == name) {
	  return "checked";
	} else {
	  return "";
	}
  }

  renameGroup(name: string) {
	this.groupList.forEach(e => {
	  if (e.name == this.selectedGroup) {
		e.name = name;
	  }
	});

	this.groupsService.addGroup(this.groupList);

	this.groupsService.setActiveGroup(name);
  }

  expandPanel() {
	this.showSubitem = !this.showSubitem;
	if (this.showSubitem) {

	} else {
	}
  }

  ngOnDestroy() {
	this.groups$.unsubscribe();
	this.activeGroup$.unsubscribe();
  }
}
