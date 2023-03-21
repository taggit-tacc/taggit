import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { LatLng } from 'leaflet';
import {
  AssetFilters,
  FeatureAsset,
  FeatureStyles,
  IFeatureAsset,
  IPointCloud,
  Overlay,
  TagGroup,
  Tag,
  TagValue,
  GroupForm,
} from '../models/models';
import { Feature, FeatureCollection } from '../models/models';
import { environment } from '../../environments/environment';
import { Form } from '@angular/forms';
import { take, first } from 'rxjs/operators';
import * as querystring from 'querystring';
import { RemoteFile } from 'ng-tapis';
import { NotificationsService } from './notifications.service';
import { ScrollService } from './scroll.service';
import { getRandomColor } from '../utils/randomColor';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class GeoDataService {
  // TODO: clean this up and put the observables up here. Also look into Replay/Behavior
  // TODO: Go over this and remove all unused functions, a lot of this was copy/pasted over from Hazmapper without a second thought
  private _features: BehaviorSubject<FeatureCollection>;
  private features$: Observable<FeatureCollection>;
  private _activeFeature: BehaviorSubject<any>;
  private _mapMouseLocation: BehaviorSubject<any>;
  private _basemap: BehaviorSubject<any>;
  private _overlays: BehaviorSubject<any>;
  private _activeOverlay: BehaviorSubject<any>;
  private _pointClouds: BehaviorSubject<Array<IPointCloud>> =
    new BehaviorSubject<Array<IPointCloud>>(null);
  public readonly pointClouds: Observable<Array<IPointCloud>> =
    this._pointClouds.asObservable();
  private fileList: Array<RemoteFile>;

  private _loaded: BehaviorSubject<boolean> = new BehaviorSubject(null);
  public loaded: Observable<boolean> = this._loaded.asObservable();

  private _activeGroupId: BehaviorSubject<number> = new BehaviorSubject(null);
  public activeGroupId: Observable<number> = this._activeGroupId.asObservable();

  private _activeGroup: BehaviorSubject<TagGroup> = new BehaviorSubject(null);
  public activeGroup: Observable<TagGroup> = this._activeGroup.asObservable();

  private _tagFeaturesQueue: BehaviorSubject<any[]> = new BehaviorSubject([]);
  public tagFeaturesQueue: Observable<any[]> =
    this._tagFeaturesQueue.asObservable();

  private _loadingFeatureProperties: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public loadingFeatureProperties: Observable<boolean> =
    this._loadingFeatureProperties.asObservable();

  private _activeGroupFeature: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );
  public activeGroupFeature: Observable<any> =
    this._activeGroupFeature.asObservable();

  private _groups: BehaviorSubject<Map<string, TagGroup>> = new BehaviorSubject(
    null
  );
  public groups: Observable<Map<string, TagGroup>> =
    this._groups.asObservable();

  private _groupsFeatures: BehaviorSubject<Map<string, Feature[]>> =
    new BehaviorSubject(null);
  public groupsFeatures: Observable<Map<string, Feature[]>> =
    this._groupsFeatures.asObservable();

  constructor(
    private http: HttpClient,
    private notificationsService: NotificationsService,
    private scrollService: ScrollService
  ) {
    this._features = new BehaviorSubject<FeatureCollection>({
      type: 'FeatureCollection',
      features: [],
    });
    this.features$ = this._features.asObservable();
    this._activeFeature = new BehaviorSubject<any>(null);
    this._mapMouseLocation = new BehaviorSubject<any>(null);

    // For the style of the basemap, defaults to OpenStreetmap
    this._basemap = new BehaviorSubject<any>('roads');

    // Holds all of the overlays on a project
    this._overlays = new BehaviorSubject<any>(null);
    this._activeOverlay = new BehaviorSubject<any>(null);
  }

  getFeature(
    projectId: number,
    feature: Feature
  ): Observable<FeatureCollection> {
    return this.http.get<FeatureCollection>(
      environment.apiUrl + `/projects/${projectId}/features/${feature.id}/`
    );
  }

  setFeatures(fc: FeatureCollection) {
    fc.features = fc.features.map((feat: Feature) => new Feature(feat));
    this.getGroups(fc.features);
    this._features.next(fc);
  }

  setFeatureProperties(featureId: string | number, properties: any) {
    this.features.pipe(first()).subscribe((fc) => {
      fc.features = fc.features.map((feat: Feature) => {
        if (feat.id === featureId) {
          feat.properties = properties;
        }
        return feat;
      });
      this.setFeatures(fc);
    });
  }

  updateTagFeaturesQueue(projectId) {
    this._tagFeaturesQueue.value.forEach((featureId) => {
      const feature = this._features.value.features.find(
        (f) => f.id == featureId
      );
      this.updateFeatureProperty(projectId, featureId, feature.properties);
    });
    this.resetTagFeaturesQueue();
  }

  setFeatureStyles(featureId: string | number, styles: FeatureStyles) {
    this.features.pipe(first()).subscribe((fc) => {
      fc.features = fc.features.map((feat: Feature) => {
        if (feat.id === featureId) {
          feat.styles = styles;
        }
        return feat;
      });
      this.setFeatures(fc);
    });
  }

  getFeatures(
    projectId: number,
    query: AssetFilters = new AssetFilters(),
    restoreScroll = false
  ): void {
    const qstring: string = querystring.stringify(query.toJson());
    this.http
      .get<FeatureCollection>(
        environment.apiUrl + `/projects/${projectId}/features/` + '?' + qstring
      )
      .subscribe(
        (fc: FeatureCollection) => {
          this.setFeatures(fc);
          this._loaded.next(true);

          if (restoreScroll) {
            this.scrollService.setScrollRestored(true);
          }
        },
        (error) => {
          this.notificationsService.showErrorToast(
            'Failed to retrieve project data! Geoapi might be down.'
          );
        }
      );
  }

  deleteFeature(feature: Feature) {
    this.http
      .delete(
        environment.apiUrl +
          `projects/${feature.project_id}/features/${feature.id}/`
      )
      .subscribe((resp) => {
        this.getFeatures(feature.project_id, new AssetFilters(), true);
      });
  }

  getPointClouds(projectId: number) {
    this.http
      .get<Array<IPointCloud>>(
        environment.apiUrl + `/projects/${projectId}/point-cloud/`
      )
      .subscribe((resp) => {
        this._pointClouds.next(resp);
      });
  }

  setActiveGroup(group: TagGroup): void {
    this._activeGroup.next(group);
    if (group) {
      const groupFeatures = this._groupsFeatures.value.get(group.name);
      if (
        !this._activeGroupFeature.value ||
        !groupFeatures.some((gf) => this._activeGroupFeature.value.id === gf.id)
      ) {
        this.setActiveGroupFeature(groupFeatures[0]);
      }
    } else {
      this.setActiveGroupFeature(null);
    }
  }

  // NOTE: Tag features queue is the local change to tags before posting it 
  // to geoapi to persist.
  setTagFeaturesQueue(featureId, updatedTag) {
    const tagFeatures = this._tagFeaturesQueue.value;
    const fc = this._features.value;

    fc.features.map((f) => {
      if (featureId == f.id) {
        if (f.properties.taggit.tags.some((t) => updatedTag.id == t.id)) {
          f.properties.taggit.tags.map((t) => {
            if (t.id == updatedTag.id) {
              t.value = updatedTag.value;
            }
            return t;
          });
        } else {
          f.properties.taggit.tags = f.properties.taggit.tags.length
            ? [...f.properties.taggit.tags, updatedTag]
            : [updatedTag];
        }
      }
      return f;
    });

    if (!tagFeatures.includes(featureId)) {
      tagFeatures.push(featureId);
    }

    this._tagFeaturesQueue.next(tagFeatures);
    this._features.next(fc);
  }

  resetTagFeaturesQueue() {
    this._tagFeaturesQueue.next([]);
  }

  setActiveGroupFeature(feat: any): void {
    this._activeGroupFeature.next(feat);
  }

  addFeature(feat: Feature): void {
    this.features$.pipe(take(1)).subscribe((current: FeatureCollection) => {
      current.features.push(feat);
      this._features.next(current);
    });
  }

  addPointCloud(
    projectId: number,
    title: string,
    conversionParams: string
  ): void {
    const payload = {
      description: title,
      conversion_parameters: conversionParams,
    };
    this.http
      .post(environment.apiUrl + `/projects/${projectId}/point-cloud/`, payload)
      .subscribe(
        (resp) => {
          this.getPointClouds(projectId);
        },
        (error) => {
          this.notificationsService.showErrorToast(
            'Failed to update image property!'
          );
        }
      );
  }

  updateFeatureProperty(
    projectId: number,
    featureId: string | number,
    groupData: any
  ): void {
    this._loadingFeatureProperties.next(true);
    this.http
      .post(
        environment.apiUrl +
          `projects/${projectId}/features/${featureId}/properties/`,
        groupData
      )
      .subscribe(
        (resp) => {
          this.features.pipe(first()).subscribe((fc) => {
            this.setFeatureProperties(featureId, groupData);
            this._loadingFeatureProperties.next(false);
          });
        },
        (error) => {
          this.notificationsService.showErrorToast(
            'Failed to save tag values!'
          );
        }
      );
  }

  // NOTE: unused for now
  updateFeatureStyles(
    projectId: number,
    featureId: string | number,
    styles: FeatureStyles
  ): void {
    this.http
      .post(
        environment.apiUrl +
          `/projects/${projectId}/features/${featureId}/styles/`,
        styles
      )
      .subscribe(
        (resp) => {
          this.features.pipe(first()).subscribe((fc) => {
            this.setFeatureStyles(featureId, styles);
          });
        },
        (error) => {
          this.notificationsService.showErrorToast(
            'Failed to update image style!'
          );
        }
      );
  }

  deletePointCloud(pc: IPointCloud): void {
    this.http
      .delete(
        environment.apiUrl + `/projects/${pc.project_id}/point-cloud/${pc.id}/`
      )
      .subscribe((resp) => {
        this.getPointClouds(pc.project_id);
      });
  }

  addFileToPointCloud(pc: IPointCloud, file: File) {
    const form = new FormData();
    form.append('file', file);
    this.http
      .post(
        environment.apiUrl + `/projects/${pc.project_id}/point-cloud/${pc.id}/`,
        form
      )
      .subscribe((resp) => {
        console.log(resp);
      });
  }

  // This function updates the underlying observable, so changes naturally flow to feature service
  importFileFromTapis(projectId: number, files: Array<RemoteFile>): void {
    const tmp = files.map((f) => ({ system: f.system, path: f.path }));
    const payload = {
      files: tmp,
    };
    this.fileList = tmp;
    this.http
      .post(
        environment.apiUrl + `projects/${projectId}/features/files/import/`,
        payload
      )

      .subscribe(
        (resp) => {
          this.notificationsService.showSuccessToast('Import started!');
        },
        (error) => {
          this.notificationsService.showImportErrorToast(
            'Import failed! Try again?'
          );
        }
      );
  }

  // An alternate function for importing images with no GPS data. A feature is created elsewhere, and the image is added to the feature
  // Inputs:
  // projectId: Id number of current project
  // features: A pre-created feature with user-defined or zeroed out gps data
  // file: A Tapis Remote File containing the image to be imported
  importImage(projectId: number, feature: Feature, path: string): void {
    const featureId = feature.id;
    let file;
    this.fileList.forEach((remoteFile) => {
      if (remoteFile.path == path) {
        file = remoteFile;
      }
    });
    const payload = { system_id: file.system, path: file.path };
    this.http
      .post(
        environment.apiUrl +
          `projects/${projectId}/features/${featureId}/assets/`,
        payload
      )
      .subscribe((resp) => {
        this.notificationsService.showSuccessToast('Import started!');
        // this.getFeatures(projectId)
      });
  }

  // Creates a new feature from an uploaded locally created feature
  uploadNewFeature(projectId: number, feature: Feature, path: string): void {
    const payload = feature;
    let response;
    // Calls the addFeatureAsset route in GeoAPI, resp is a list of features
    this.http
      .post(environment.apiUrl + `projects/${projectId}/features/`, payload)
      .subscribe((resp) => {
        response = new Feature(resp[0]);
        this.importImage(projectId, response, path);
      });
  }

  downloadGeoJSON(projectId: number, query: AssetFilters = new AssetFilters()) {
    const qstring: string = querystring.stringify(query.toJson());
    const downloadLink = document.createElement('a');

    this.http
      .get<FeatureCollection>(
        environment.apiUrl + `/projects/${projectId}/features/` + '?' + qstring
      )
      .subscribe((resp) => {
        const blob = new Blob([JSON.stringify(resp)], {
          type: 'application/json',
        });
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.setAttribute('download', 'hazmapper.json');
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      });
  }

  uploadFile(projectId: number, file: File): void {
    const form: FormData = new FormData();
    form.append('file', file, file.name);
    this.http
      .post<Array<Feature>>(
        environment.apiUrl + `/projects/${projectId}/features/files/`,
        form
      )
      .subscribe(
        (feats) => {
          feats.forEach((feat) => {
            this.addFeature(new Feature(feat));
          });
        },
        (error) => {
          // TODO: Add notification
        }
      );
  }

  uploadAssetFile(projectId: number, featureId: number, file: File): void {
    const form: FormData = new FormData();
    form.append('file', file, file.name);
    this.http
      .post<Feature>(
        environment.apiUrl +
          `/api/projects/${projectId}/features/${featureId}/assets/`,
        form
      )
      .subscribe(
        (feature) => {
          // TODO workaround to update activeFeature
          const f = this._activeFeature.getValue();
          if (f && f.id === featureId) {
            this.activeFeature = new Feature(feature);
            this.getFeatures(projectId);
          }
        },
        (error) => {
          // TODO: Add notification
        }
      );
  }

  getOverlays(projectId: number): void {
    this.http
      .get(environment.apiUrl + `/projects/${projectId}/overlays/`)
      .subscribe((ovs: Array<Overlay>) => {
        this._overlays.next(ovs);
      });
  }

  addOverlay(
    projectId: number,
    file: File,
    label: string,
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number
  ) {
    const payload = new FormData();
    payload.append('file', file);
    payload.append('label', label);
    payload.append('minLat', minLat.toFixed(6));
    payload.append('maxLat', maxLat.toFixed(6));
    payload.append('minLon', minLon.toFixed(6));
    payload.append('maxLon', maxLon.toFixed(6));

    this.http
      .post(environment.apiUrl + `/projects/${projectId}/overlays/`, payload)
      .subscribe((resp) => {
        this.getOverlays(projectId);
      });
  }

  // Call on getFeatures (each time feature update)
  getGroups(featureList: Feature[]): void {
    const groups = new Map<string, TagGroup>();
    const groupsFeatures = new Map<string, Feature[]>();
    featureList
      .filter(
        (feat: Feature) =>
          feat.properties.taggit.groups && feat.properties.taggit.groups.length > 0
      )
      .forEach((feat: Feature) => {
        feat.properties.taggit.group.forEach((group: TagGroup) => {
          groupsFeatures.set(
            group.name,
            groupsFeatures.has(group.name)
              ? [...groupsFeatures.get(group.name), feat]
              : [feat]
          );
          groups.set(group.name, group);
        });
      });
    this._groups.next(groups);
    this._groupsFeatures.next(groupsFeatures);
    const activeGroup = this._activeGroup.value;
    if (activeGroup) {
      this.setActiveGroup(groups.get(activeGroup.name));
    }
  }

  getGroup(groupName: string) {
    return this._groups.value.get(groupName);
  }

  getGroupFeatures(featureList: Feature[], group: TagGroup) {
    return featureList.filter(
      (feat: Feature) =>
        feat.properties.taggit.groups &&
        feat.properties.taggit.groups.length &&
        feat.properties.taggit.groups.some((grp: TagGroup) => grp.id === group.id)
    );
  }

  private createGroup(
    featureList: Feature[],
    group: TagGroup,
    style?: FeatureStyles
  ): Feature[] {
    return featureList.map((feat: Feature) => {
      const groupProp = feat.properties.taggit.group.filter((grp: TagGroup) => grp.id !== group.id);
      groupProp.push(group);
      feat.properties.taggit.groups = groupProp;
      feat.properties.style = style
        ? style
        : feat.properties.style
        ? feat.properties.style
        : {};

      return feat;
    });
  }

  private updateGroup(
    featureList: Feature[],
    group: TagGroup,
    style?: FeatureStyles
  ): Feature[] {
    return this.getGroupFeatures(featureList, group).map((feat: Feature) => {
      const groupProp = feat.properties.taggit.groups.filter(
        (grp: TagGroup) => grp.id !== group.id
      );
      groupProp.push(group);
      feat.properties.taggit.groups = groupProp;
      feat.properties.style = style
        ? style
        : feat.properties.style
        ? feat.properties.style
        : {};

      return feat;
    });
  }

  private deleteGroup(featureList: Feature[], group: TagGroup): Feature[] {
    return this.getGroupFeatures(featureList, group).map((feat: Feature) => {
      feat.properties.taggit.groups = feat.properties.taggit.groups.filter(
        (grp: TagGroup) => grp.id !== group.id
      );
      return feat;
    });
  }

  createNewGroup(projectId: number, featureList: Feature[], name: string) {
    const id = uuidv4();
    const myRandColor: string = getRandomColor();
    const group: TagGroup = {
      id,
      name,
      color: myRandColor,
      icon: 'fa-house-damage',
    };
    const style = {
      color: myRandColor,
      faIcon: 'fa-house-damage',
    };
    this.createGroupFeatures(projectId, featureList, group, style);
    return group;
  }

  createGroupFeatures(
    projectId: number,
    featureList: Feature[],
    group: TagGroup,
    style?: FeatureStyles
  ) {
    if (style) {
      this.createGroup(featureList, group, style).forEach((feat: Feature) => {
        this.updateFeatureProperty(projectId, feat.id, feat.properties);
      });
    } else {
      this.createGroup(featureList, group).forEach((feat: Feature) => {
        this.updateFeatureProperty(projectId, feat.id, feat.properties);
      });
    }
  }

  deleteGroupFeatures(
    projectId: number,
    featureList: Feature[],
    group: TagGroup
  ) {
    this.deleteGroup(featureList, group).forEach((feat: Feature) => {
      this.updateFeatureProperty(projectId, feat.id, feat.properties);
    });
  }

  updateGroupFeatures(
    projectId: number,
    featureList: Feature[],
    group: TagGroup,
    style?: FeatureStyles
  ) {
    if (style) {
      this.updateGroup(featureList, group, style).forEach((feat: Feature) => {
        this.updateFeatureProperty(projectId, feat.id, feat.properties);
      });
    } else {
      this.updateGroup(featureList, group).forEach((feat: Feature) => {
        this.updateFeatureProperty(projectId, feat.id, feat.properties);
      });
    }
  }

  renameGroup(
    projectId: number,
    featureList: Feature[],
    group: TagGroup,
    name: string
  ): void {
    const renamedGroup = {
      ...group,
      name,
    };

    this.updateGroupFeatures(projectId, featureList, renamedGroup);
  }

  reiconGroup(
    projectId: number,
    featureList: Feature[],
    group: TagGroup,
    icon: string
  ): void {
    const reiconedGroup = {
      ...group,
      icon,
    };

    const reiconedStyle = {
      faIcon: icon,
      color: group.color ? group.color : '#00C8FF',
    };

    this.updateGroupFeatures(
      projectId,
      featureList,
      reiconedGroup,
      reiconedStyle
    );
  }

  public get overlays(): Observable<Array<Overlay>> {
    return this._overlays.asObservable();
  }

  public get features(): Observable<FeatureCollection> {
    return this._features.asObservable();
  }

  public get activeFeature() {
    return this._activeFeature.asObservable();
  }

  // TODO: This is heinous
  public set activeFeature(f: any) {
    if (f) {
      if (f === this._activeFeature.getValue()) {
        this._activeFeature.next(null);
      } else {
        this._activeFeature.next(f);
      }
    } else {
      this._activeFeature.next(null);
    }
  }

  public get activeOverlay(): Observable<Overlay> {
    return this._activeOverlay.asObservable();
  }

  public set activeOverlay(ov) {
    this._activeOverlay.next(ov);
  }

  public get mapMouseLocation(): Observable<LatLng> {
    return this._mapMouseLocation.asObservable();
  }

  public set mapMouseLocation(loc) {
    this._mapMouseLocation.next(loc);
  }

  public set basemap(bmap) {
    this._basemap.next(bmap);
  }

  public get basemap(): any {
    return this._basemap.asObservable();
  }
}
