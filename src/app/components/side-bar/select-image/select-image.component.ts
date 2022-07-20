import { Component, OnInit, OnDestroy } from '@angular/core';
import { FeatureCollection } from 'geojson';
import { Project } from '../../../models/models';
import { ProjectsService } from '../../../services/projects.service';
import { GeoDataService } from '../../../services/geo-data.service';
import { FormsService } from '../../../services/forms.service';
import { GroupsService } from '../../../services/groups.service';
import { Subscription } from 'rxjs';
import { Feature } from '@turf/turf';

@Component({
  selector: 'app-select-image',
  templateUrl: './select-image.component.html',
  styleUrls: ['./select-image.component.scss'],
})
export class SelectImageComponent implements OnInit, OnDestroy {
  groups$: Subscription;
  activeGroup$: Subscription;

  public selectedProject: Project;
  activeGroup: string;
  activeGroupFeature: Feature;
  showSidebar: boolean;
  showSubitem: boolean = true;
  tempGroup: Array<Feature>;
  groupsFeatures: Map<string, any>;

  constructor(
    private formsService: FormsService,
    private groupsService: GroupsService,
    private geoDataService: GeoDataService,
    private projectsService: ProjectsService
  ) {}

  ngOnInit() {
    this.projectsService.activeProject.subscribe((next) => {
      this.selectedProject = next;
    });

    this.geoDataService.groupsFeatures.subscribe((next) => {
      this.groupsFeatures = next;
    });

    this.groupsService.activeGroupFeature.subscribe((next) => {
      // console.log(next);
      this.activeGroupFeature = next;
    });

    this.activeGroup$ = this.groupsService.activeGroup.subscribe((next) => {
      this.activeGroup = next;
    });
  }

  getActiveFeatures() {
    return this.groupsFeatures.get(this.activeGroup);
  }

  jumpToImage(feat: Feature) {
    this.groupsService.setActiveGroupFeature(feat);
  }

  isActiveFeature(feature: Feature) {
    return this.activeGroupFeature.id === feature.id;
  }

  // TODO: ensure ui is updated from getFeatures()
  deleteGroup(name: string) {
    const features = this.groupsFeatures.get(name);
    this.geoDataService.deleteGroupFeatures(
      this.selectedProject.id,
      features,
      name
    );

    // this.groupList.forEach((group) => {
    //   if (group.name == name) {
    //     this.tempGroup = group.features;
    //     this.groupList = this.groupList.filter((e) => e.name != name);
    //   }
    // });
    //
    // for (let feat of this.tempGroup) {
    //   let featProp = feat.properties;
    //
    //   featProp.group = featProp.group.filter((e) => e.name != name);
    //
    //   this.geoDataService.updateFeatureProperty(
    //     this.selectedProject.id,
    //     Number(feat.id),
    //     featProp
    //   );
    //
    //   this.groupsService.addGroup(this.groupList);
    // }

    // if (this.groupList.length <= 0) {
    //   this.showSidebar = false;
    //   this.groupsService.setShowSidebar(this.showSidebar);
    // } else {
    //   this.groupsService.setActiveGroup(this.groupList[0].name);
    // }
  }

  //Might move the guts of this method to either featureService or groupService and have it update the observable
  //Delete asset removes the feature from the active group
  deleteAsset(feat: any) {
    this.geoDataService.deleteGroupFeatures(
      this.selectedProject.id,
      [feat],
      this.activeGroup
    );

    // this.groupList.forEach((group) => {
    //   if (group.name === this.activeGroup) {
    //     this.tempGroup = group.features;
    //     if (group.features.length == 1) {
    //       this.deleteGroup(group.name);
    //     } else {
    //       group.features = group.features.filter(
    //         (asset) => asset.id != assetId
    //       );
    //     }
    //   }
    // });
    //
    // for (let feat of this.tempGroup) {
    //   let featProp = feat.properties;
    //   if (feat.id == assetId) {
    //     featProp.group = featProp.group.filter(
    //       (e) => e.name != this.activeGroup
    //     );
    //   }
    //
    //   this.geoDataService.updateFeatureProperty(
    //     this.selectedProject.id,
    //     Number(feat.id),
    //     featProp
    //   );
    //   this.groupsService.addGroup(this.groupList);
    // }
  }

  getAssetDisplay(asset: any) {
    if (asset.assets[0].display_path) {
      return /[^/]*$/.exec(asset.assets[0].display_path)[0];
    } else {
      let apath = /[^/]*$/.exec(asset.assets[0].path)[0];
      return apath.slice(0, 15) + '...';
    }
  }

  ngOnDestroy() {
    this.groups$.unsubscribe();
    this.activeGroup$.unsubscribe();
  }

  expandPanel() {
    this.showSubitem = !this.showSubitem;
    if (this.showSubitem) {
    } else {
    }
  }
}
