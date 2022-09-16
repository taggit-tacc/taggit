import { Component, OnInit } from '@angular/core';
import { FeatureCollection } from 'geojson';
import { Project, TagGroup } from '../../../models/models';
import { ProjectsService } from '../../../services/projects.service';
import { GeoDataService } from '../../../services/geo-data.service';
import { FormsService } from '../../../services/forms.service';
import { Subscription } from 'rxjs';
import { Feature } from '@turf/turf';

@Component({
  selector: 'app-select-image',
  templateUrl: './select-image.component.html',
  styleUrls: ['./select-image.component.scss'],
})
export class SelectImageComponent implements OnInit {
  public activeProject: Project;
  private groups: Map<string, TagGroup>;
  activeGroup: TagGroup;
  activeGroupFeature: Feature;
  showSubitem = true;
  groupsFeatures: Map<string, any>;

  constructor(
    private formsService: FormsService,
    private geoDataService: GeoDataService,
    private projectsService: ProjectsService
  ) {}

  ngOnInit() {
    this.projectsService.activeProject.subscribe((next) => {
      this.activeProject = next;
    });

    this.geoDataService.groups.subscribe((next) => {
      this.groups = next;
    });

    this.geoDataService.activeGroup.subscribe((next) => {
      this.activeGroup = next;
    });

    this.geoDataService.activeGroupFeature.subscribe((next) => {
      this.activeGroupFeature = next;
    });

    this.geoDataService.groupsFeatures.subscribe((next) => {
      this.groupsFeatures = next;
      if (next && this.activeGroup) {
        const groupFeatures = this.groupsFeatures.get(this.activeGroup.name);
        if (groupFeatures) {
          if (!groupFeatures.some(f => f.id === this.activeGroupFeature.id)) {
            this.geoDataService.setActiveGroupFeature(groupFeatures[0]);
          }
        } else {
          const [nextGroup] = this.groups.values();
          if (nextGroup) {
            this.geoDataService.setActiveGroup(nextGroup);
          } else {
            this.geoDataService.setActiveGroup(null);
          }
        }
      }
    });
  }

  getActiveFeatures() {
    if (this.activeGroup) {
      const groupFeatures = this.groupsFeatures.get(this.activeGroup.name);
      const group = this.groups.get(this.activeGroup.name);
      if (group) {
        return groupFeatures;
      } else {
        const [nextGroup] = this.groups.values();
        if (nextGroup) {
          this.geoDataService.setActiveGroup(nextGroup);
          return this.groupsFeatures.get(nextGroup.name);
        } else {
          return [];
        }
      }
    } else {
      return [];
    }
  }

  jumpToImage(feat: Feature) {
    this.geoDataService.setActiveGroupFeature(feat);
  }

  isActiveFeature(feature: Feature) {
    return this.activeGroupFeature.id === feature.id;
  }

  deleteFeature(feat: any) {
    this.geoDataService.deleteGroupFeatures(
      this.activeProject.id,
      [feat],
      this.groups.get(this.activeGroup.name)
    );
  }

  getFeaturePath(feat: any) {
    return feat.featureShortPath();
  }

  expandPanel() {
    this.showSubitem = !this.showSubitem;
  }
}
