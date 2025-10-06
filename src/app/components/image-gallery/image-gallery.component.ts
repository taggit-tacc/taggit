import {
  AfterViewChecked,
  Component,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { GeoDataService } from '../../services/geo-data.service';
import {
  Feature,
  Project,
  TagGroup,
} from '../../models/models';
import { ProjectsService } from '../../services/projects.service';
import { EnvService } from '../../services/env.service';
import { ScrollService } from 'src/app/services/scroll.service';
import { GroupsService } from '../../services/groups.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ModalCreateProjectComponent } from '../modal-create-project/modal-create-project.component';
import { FeatureService } from 'src/app/services/feature.service';

@Component({
  selector: 'app-image-gallery',
  templateUrl: './image-gallery.component.html',
  styleUrls: ['./image-gallery.component.scss'],
})
export class ImageGalleryComponent implements OnInit, AfterViewChecked {

  public projects: Project[];
  groupName: string;
  showTagger = false;
  scrolling = false;
  scrollStatus: string;
  imagesExist = false;
  projectsExist: boolean;
  featureList: Array<any> = [];
  featureListScroll: Array<any>;
  scrollSum = 15;
  activeGroup: TagGroup;
  activeFeature: Feature;
  activeGroupFeature: Feature;
  featurePath: string;

  groupsFeatures: Map<string, any>;
  groups: Map<string, any>;

  // Loading and error states
  loaded = false;
  loadingGallery = false;
  hasError = false;
  errorMessage = '';


  constructor(
    private geoDataService: GeoDataService,
    private projectsService: ProjectsService,
    private groupsService: GroupsService,
    private readonly cdr: ChangeDetectorRef,
    private envService: EnvService,
    private spinner: NgxSpinnerService,
    private dialog: MatDialog,
    private scrollService: ScrollService,
    private featureService: FeatureService
  ) {}

  ngAfterViewChecked() {
    if (this.scrollService.scrollRestored) {
      this.scrollService.scroll();
    }
    this.cdr.detectChanges();
  }

  ngOnInit() {
    this.geoDataService.loaded.subscribe(
      (isLoaded) => {
        this.loaded = isLoaded;
        this.hasError = false;
      },
      (error) => {
        console.error('Error loading initial data:', error);
        this.loaded = true;
        this.hasError = true;
        this.errorMessage = 'Failed to load data. Please try refreshing the page.';
      }
    );

    this.geoDataService.loadingGallery.subscribe(isLoading => {
      this.loadingGallery = isLoading;
    });

    this.featureService.features$.subscribe((fc: any) => {
      this.imagesExist = false;
      if (fc) {
        if (fc.features.length > 0) {
          this.featureList = fc.features.filter((feature) => {
            try {
              return (
                feature.initialAsset() && feature.featureType() === 'image'
              );
            } catch (error) {
              // If a feature has no asset, it ends up in this catch
              console.error(error);
              // After outputting the error, add an "image not found" placeholder,
              // Allowing users to still select their errored import
              // Note that this doesn't really work!
              feature.assets.push({ path: '../../images/Image-not-found.png' });
              return false;
            }
          });
          if (this.featureList.length > 0) {
            this.imagesExist = true;
          }
          this.featureListScroll = this.featureList.slice(0, this.scrollSum);
        } else {
          this.imagesExist = false;
        }
      }
    });

    this.projectsService.projects.subscribe((projects) => {
      this.projects = projects;
      if (this.projects.length) {
        this.projectsExist = true;
      } else {
        this.projectsExist = false;
      }
    });

    this.geoDataService.groupsFeatures.subscribe((next) => {
      this.groupsFeatures = next;
    });

    this.geoDataService.groups.subscribe((next) => {
      this.groups = next;
    });

    this.geoDataService.activeFeature.subscribe((next) => {
      if (next) {
        this.activeFeature = next;
      }
    });

    this.geoDataService.activeGroup.subscribe((next: TagGroup) => {
      this.activeGroup = next;
    });

    this.geoDataService.activeGroupFeature.subscribe((next) => {
      this.activeGroupFeature = next;
    });

    this.geoDataService.groups.subscribe((next) => {
      this.groups = next;
    });

    this.groupsService.showTagger.subscribe((next) => {
      this.showTagger = next;
      this.scrollStatus = next ? 'success' : 'danger';
    });
  }

  getPath() {
    return (
      this.envService.apiUrl +
      '/assets/' +
      this.activeGroupFeature.assets[0].path.replace(/([^:])(\/{2,})/g, '$1/')
    );
  }

  appendSum() {
    if (this.featureList.length != 0) {
      if (this.scrollSum == this.featureList.length) {
        this.spinner.hide();
        this.scrolling = false;
        return;
      }
      // If scrollSum is larger than the length of the feature list, curtail it to just be the length
      if (this.scrollSum > this.featureList.length) {
        this.scrollSum = this.featureList.length;
      }
    }
    this.featureListScroll = this.featureList.slice(0, this.scrollSum);
    setTimeout(() => {
      this.spinner.hide();
      this.scrolling = false;
    }, 1300);
  }

  onScroll() {
    if (!this.scrolling) {
      this.spinner.show();
      this.scrollSum += 10;
      this.appendSum();
      this.scrolling = true;
    }
  }

  openCreateProjectModal() {
    this.dialog.open(ModalCreateProjectComponent, {
      height: '400px',
      width: '600px',
    });
  }
}
