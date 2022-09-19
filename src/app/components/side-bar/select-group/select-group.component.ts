import { Component, OnInit, OnDestroy, TemplateRef } from '@angular/core';
import { Project, TagGroup } from '../../../models/models';
import { ProjectsService } from '../../../services/projects.service';
import { FormsService } from '../../../services/forms.service';
import { GroupsService } from '../../../services/groups.service';
import { GeoDataService } from '../../../services/geo-data.service';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { FeatureService } from 'src/app/services/feature.service';

import { groupIcons } from 'src/app/utils/groups';

@Component({
  selector: 'app-select-group',
  templateUrl: './select-group.component.html',
  styleUrls: ['./select-group.component.scss'],
})
export class SelectGroupComponent implements OnInit, OnDestroy {
  groups$: Subscription;
  activeGroup$: Subscription;

  public selectedProject: Project;

  iconList = groupIcons;
  selectedIcon = 'fa-house-damage';

  selectedGroup: TagGroup;

  activeGroup: TagGroup;
  groups: Map<string, TagGroup>;
  groupsFeatures: Map<string, any>;

  showTagger: boolean;
  showSubitem = true;

  constructor(
    private groupsService: GroupsService,
    private geoDataService: GeoDataService,
    private projectsService: ProjectsService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.projectsService.activeProject.subscribe((next) => {
      this.selectedProject = next;
    });

    this.groups$ = this.geoDataService.groups.subscribe((next) => {
      this.groups = next;
    });

    this.geoDataService.groupsFeatures.subscribe((next) => {
      this.groupsFeatures = next;
    });

    this.activeGroup$ = this.geoDataService.activeGroup.subscribe((next) => {
      this.activeGroup = next;
      if (!next) {
        this.groupsService.toggleTagger();
      }
    });
  }

  selectGroupForm(group: TagGroup) {
    this.geoDataService.setActiveGroup(group);
  }

  openRenameOptionModal(template: TemplateRef<any>) {
    this.dialog.open(template);
  }

  // TODO: ensure ui is updated from getFeatures()
  deleteGroup(group: TagGroup) {
    const features = this.groupsFeatures.get(group.name);
    this.geoDataService.deleteGroupFeatures(
      this.selectedProject.id,
      features,
      group
    );
  }

  openRenameModal(template: TemplateRef<any>, group: TagGroup) {
    this.selectedGroup = group;
    this.dialog.open(template);
  }

  openIconSelection(template: TemplateRef<any>, group: TagGroup) {
    this.selectedGroup = group;
    this.selectedIcon = group.icon;
    this.dialog.open(template);
  }

  saveIcon(icon: string) {
    this.geoDataService.reiconGroup(
      this.selectedProject.id,
      this.groupsFeatures.get(this.selectedGroup.name),
      this.groups.get(this.selectedGroup.name),
      icon
    );

    this.dialog.closeAll();
    // TODO: Update save styles
    // for (let feat of this.tempGroup) {
    //   this.formsService.saveStyles('default', Number(feat.id));
    // }
  }

  isChecked(name: string) {
    if (this.activeGroup && this.activeGroup.name === name) {
      return 'checked';
    } else {
      return '';
    }
  }

  renameGroup(name: string) {
    this.geoDataService.renameGroup(
      this.selectedProject.id,
      this.groupsFeatures.get(this.selectedGroup.name),
      this.groups.get(this.selectedGroup.name),
      name
    );

    this.dialog.closeAll();
  }

  expandPanel() {
    this.showSubitem = !this.showSubitem;
  }

  ngOnDestroy() {
    this.groups$.unsubscribe();
    this.activeGroup$.unsubscribe();
  }
}
