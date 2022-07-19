import { AfterViewChecked, Component, OnInit, Renderer2 } from '@angular/core';
import { GeoDataService } from '../../services/geo-data.service';
import {
  FeatureAsset,
  Feature,
  Project,
  FeatureCollection,
} from '../../models/models';
import { AppEnvironment, environment } from '../../../environments/environment';
import { ProjectsService } from '../../services/projects.service';
import { ScrollService } from 'src/app/services/scroll.service';
import { GroupsService } from '../../services/groups.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { startWith } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ModalCreateProjectComponent } from '../modal-create-project/modal-create-project.component';
import { FeatureService } from 'src/app/services/feature.service';

@Component({
  selector: 'app-image-gallery',
  templateUrl: './image-gallery.component.html',
  styleUrls: ['./image-gallery.component.scss'],
})
export class ImageGalleryComponent implements OnInit, AfterViewChecked {
  environment: AppEnvironment;
  // features: FeatureCollection;
  // FIXME feature collection giving me an error when trying to access assets
  // features: any;
  tempGroup: Array<Feature>;
  groupList: Array<any>;
  // showGroupBar: boolean;

  public projects: Project[];
  showGroup: boolean;
  groupName: string;
  showSidebar: boolean;
  scrolling: boolean = false;
  status: boolean;
  groupExist: boolean;
  imagesExist: boolean;
  projectsExist: boolean;
  featureList: Array<any> = [];
  featureListScroll: Array<any>;
  scrollSum: number = 15;
  activeGroup: string;
  activeFeature: Feature;
  activeFeatureNum: number;
  featurePath: string;
  loaded: boolean;
  groupsFeatures: Map<string, any>;

  constructor(
    private geoDataService: GeoDataService,
    private projectsService: ProjectsService,
    private groupsService: GroupsService,
    private renderer: Renderer2,
    private spinner: NgxSpinnerService,
    private dialog: MatDialog,
    private scrollService: ScrollService,
    private featureService: FeatureService
  ) {}

  ngAfterViewChecked() {
    if (this.scrollService.scrollRestored) {
      this.scrollService.scroll();
    }
  }

  ngOnInit() {
    this.environment = environment;

    // this.activeFeatureNum = 0;
    // FIXME feature collection giving me an error when trying to access assets
    // this.geoDataService.features.subscribe( (fc: FeatureCollection) => {

    this.geoDataService.features.subscribe();

    this.geoDataService.loaded.subscribe(
      (e) => {
        this.loaded = e;
      },
      (error) => {
        this.projectsExist = false;
      }
    );

    this.featureService.features$.subscribe((fc: any) => {
      if (fc) {
        if (fc.features.length > 0) {
          this.imagesExist = true;
          this.featureList = fc.features.filter((feature) => {
            try {
              return (
                feature.assets[0] && feature.assets[0].asset_type === 'image'
              );
            } catch (error) {
              //If a feature has no asset, it ends up in this catch
              console.error(error);
              //After outputting the error, add an "image not found" placeholder,
              //Allowing users to still select their errored import
              //Note that this doesn't really work!
              feature.assets.push({ path: '../../images/Image-not-found.png' });
              return false;
            }
          });
          console.log(this.featureList);
          this.featureListScroll = this.featureList.slice(0, this.scrollSum);
        } else {
          this.imagesExist = false;
        }
      }
    });

    /*
	//I think doing a more natural refresh in here will cause a dynamic reload
	this.geoDataService.features.subscribe( (fc: any) => {
	  if (fc) {
		if (fc.features.length > 0) {
		  this.imagesExist = true;
			this.featureList = fc.features.filter(feature => {
			  try{
				return feature.assets[0].asset_type === "image";
		  	  } catch (error) {
				//If a feature has no asset, it ends up in this catch
			  	console.error(error)
				//After outputting the error, add an "image not found" placeholder,
				//Allowing users to still select their errored import
				feature.assets.push({
					"path": "../../images/Image-not-found.png"
				})
				return false
		  	  }
			});
			this.featureListScroll = this.featureList.slice(0, this.scrollSum);
		} else {
		  this.imagesExist = false;
		}
	  }
	});*/

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

    this.geoDataService.activeFeature.subscribe((next) => {
      if (next) {
        this.activeFeature = next;
      }
    });

    this.groupsService.groups.subscribe((next) => {
      this.groupList = next;
    });

    this.groupsService.activeGroup.subscribe((next) => {
      this.activeGroup = next;
    });

    this.groupsService.featureImagesExist.subscribe((next) => {
      this.groupExist = next;
    });

    this.groupsService.tempGroup.subscribe((next) => {
      this.tempGroup = next;
    });

    this.groupsService.showGroup.subscribe((next) => {
      this.showGroup = next;
    });

    this.groupsService.activeFeatureNum.pipe(startWith(0)).subscribe((next) => {
      this.activeFeatureNum = next;
    });

    this.groupsService.showSidebar.subscribe((next) => {
      this.showSidebar = next;
      // this.status = !this.status;
      if (next) {
        this.status = true;
      } else {
        this.status = false;
      }
    });

    this.groupsService.setActiveFeatureNum(0);
  }

  getPath(): string {
    // let featureSource = this.environment.apiUrl + '/assets/' + this.activeFeature.assets[0].path;
    let activeGroupObj = this.groupList.filter(
      (realGroup) => realGroup.name === this.activeGroup
    );
    if (activeGroupObj[0] != undefined) {
      if (
        activeGroupObj[0].features[this.activeFeatureNum].assets[0].path ==
        undefined
      ) {
        this.groupsService.setActiveFeatureNum(0);
        // this.groupsService.setActiveFeatureNum(0);
        if (activeGroupObj[0].features[this.activeFeatureNum] == undefined) {
          this.groupsService.setActiveGroup(this.groupList[0].name);
        }
      }
    }
    let featureSource =
      this.environment.apiUrl +
      '/assets/' +
      activeGroupObj[0].features[this.activeFeatureNum].assets[0].path;

    // this.groupsService.setActiveFeatureId(
    //   activeGroupObj[0].features[this.activeFeatureNum].id
    // );
    featureSource = featureSource.replace(/([^:])(\/{2,})/g, '$1/');
    return featureSource;
  }

  appendSum() {
    if (this.featureList.length != 0) {
      if (this.scrollSum == this.featureList.length) {
        this.spinner.hide();
        this.scrolling = false;
        return;
      }
      //If scrollSum is larger than the length of the feature list, curtail it to just be the length
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
    // if (this.notscrolly && this.notEmptyPost) {
    //   this.spinner.show();
    //   this.notscrolly = false;
    //   this.loadNextPost();
    // }
    // console.log('scrolled!!');
  }

  openCreateProjectModal() {
    this.dialog.open(ModalCreateProjectComponent, {
      height: '400px',
      width: '600px',
    });

    // modal.afterClosed().subscribe( (files: Array<RemoteFile>) => {
    //   this.geoDataService.importFileFromTapis(this.selectedProject.id, files);
    // });
  }
}
