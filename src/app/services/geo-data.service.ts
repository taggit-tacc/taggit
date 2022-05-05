import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, ReplaySubject, Subject} from 'rxjs';
import {LatLng} from 'leaflet';
import {AssetFilters, FeatureAsset, IFeatureAsset, IPointCloud, Overlay} from '../models/models';
import { Feature, FeatureCollection} from '../models/models';
import { environment } from '../../environments/environment';
import {Form} from '@angular/forms';
import {take} from 'rxjs/operators';
import * as querystring from 'querystring';
import {RemoteFile} from 'ng-tapis';
import { NotificationsService } from './notifications.service';
import { ScrollService } from './scroll.service';

@Injectable({
  providedIn: 'root'
})
export class GeoDataService {


  // TODO: clean this up and put the observables up here. Also look into Replay/Behavior
  //TODO: Go over this and remove all unused functions, a lot of this was copy/pasted over from Hazmapper without a second thought
  private _features: BehaviorSubject<FeatureCollection>;
  private features$: Observable<FeatureCollection>;
  private _activeFeature: BehaviorSubject<any>;
  private _mapMouseLocation: BehaviorSubject<any>;
  private _basemap: BehaviorSubject<any>;
  private _overlays: BehaviorSubject<any>;
  private _activeOverlay: BehaviorSubject<any>;
  private _pointClouds: BehaviorSubject<Array<IPointCloud>> = new BehaviorSubject<Array<IPointCloud>>(null);
  public readonly pointClouds: Observable<Array<IPointCloud>> = this._pointClouds.asObservable();
  private fileList: Array<RemoteFile>

  private _loaded: BehaviorSubject<boolean> = new BehaviorSubject(null);
  public loaded: Observable<boolean> = this._loaded.asObservable();

  constructor(private http: HttpClient,
	private notificationsService: NotificationsService,
	private scrollService: ScrollService) {
	this._features = new BehaviorSubject<FeatureCollection>({type: 'FeatureCollection', features: []});
	this.features$ = this._features.asObservable();
	this._activeFeature = new BehaviorSubject<any>(null);
	this._mapMouseLocation = new BehaviorSubject<any>(null);

	// For the style of the basemap, defaults to OpenStreetmap
	this._basemap = new BehaviorSubject<any>('roads');

	// Holds all of the overlays on a project
	this._overlays = new BehaviorSubject<any>(null);
	this._activeOverlay = new BehaviorSubject<any>(null);
  }

  getFeatures(projectId: number, query: AssetFilters = new AssetFilters(), restoreScroll = false): void {
	const qstring: string = querystring.stringify(query.toJson());
	this.http.get<FeatureCollection>(environment.apiUrl + `/projects/${projectId}/features/` + '?' + qstring)
	  .subscribe( (fc: FeatureCollection) => {
		fc.features = fc.features.map( (feat: Feature) => new Feature(feat));
		this._features.next(fc);
		// this._loaded.next(false);
		this._loaded.next(true);

		if ( restoreScroll ) {
			this.scrollService.setScrollRestored(true)
		}
	  });
  }

  deleteFeature(feature: Feature) {
	this.http.delete(environment.apiUrl + `projects/${feature.project_id}/features/${feature.id}/`)
	  .subscribe( (resp) => {
		this.getFeatures(feature.project_id, new AssetFilters(), true);
	  });
  }

  getPointClouds(projectId: number) {
	this.http.get<Array<IPointCloud>>(environment.apiUrl + `/projects/${projectId}/point-cloud/`)
	  .subscribe( (resp ) => {
	// console.log(resp);
	this._pointClouds.next(resp);
	  });
  }

  addFeature(feat: Feature): void {
	this.features$.pipe(take(1)).subscribe( (current: FeatureCollection) => {
	  current.features.push(feat);
	  this._features.next(current);
	});
  }

  addPointCloud(projectId: number, title: string, conversionParams: string): void {
	const payload = {
	  description: title,
	  conversion_parameters: conversionParams
	};
	this.http.post(environment.apiUrl + `/projects/${projectId}/point-cloud/`, payload)
	  .subscribe( (resp) => {
	this.getPointClouds(projectId);
	  }, error => {
	// TODO: notification
	  });
  }

  updateFeatureProperty(projectId: number, featureId: number, groupData: any): void {
	this.http.post(environment.apiUrl + `projects/${projectId}/features/${featureId}/properties/`, groupData)
	  .subscribe( (resp) => {
	  }, error => {
	  });
  }

  updateFeatureStyle(projectId: number, featureId: number, groupData: any): void {
	this.http.post(environment.apiUrl + `/projects/${projectId}/features/${featureId}/styles/`, groupData)
	  .subscribe( (resp) => {
	  }, error => {
	  });
  }

  deletePointCloud(pc: IPointCloud): void {
	console.log(pc);
	this.http.delete(environment.apiUrl + `/projects/${pc.project_id}/point-cloud/${pc.id}/`)
	  .subscribe( (resp) => {
	this.getPointClouds(pc.project_id);
	  });
  }

  addFileToPointCloud(pc: IPointCloud, file: File) {
	const form = new FormData();
	form.append('file', file);
	console.log(pc);
	this.http.post(environment.apiUrl + `/projects/${pc.project_id}/point-cloud/${pc.id}/`, form)
	  .subscribe( (resp) => {
	console.log(resp);
	  });
  }

  //This function updates the underlying observable, so changes naturally flow to feature service
  importFileFromTapis(projectId: number, files: Array<RemoteFile>): void {

	const tmp = files.map( f => ({system: f.system, path: f.path}));
	const payload = {
	  files: tmp
	};
	this.fileList = tmp
	this.http.post(environment.apiUrl + `projects/${projectId}/features/files/import/`, payload)
	  .subscribe( (resp) => {
		this.notificationsService.showSuccessToast('Import started!');
	  }, error => {
		this.notificationsService.showImportErrorToast('Import failed! Try again?');
	  });
  }

  //An alternate function for importing images with no GPS data. A feature is created elsewhere, and the image is added to the feature
  //Inputs:
  //projectId: Id number of current project
  //features: A pre-created feature with user-defined or zeroed out gps data
  //file: A Tapis Remote File containing the image to be imported
  importImage(projectId: number, feature: Feature, path: string): void {
	let featureId = feature.id
	let file
	this.fileList.forEach(remoteFile =>{
		if (remoteFile.path == path) {
			file = remoteFile
		}
	});
	let payload = {system_id: file.system, path: file.path};
	this.http.post(environment.apiUrl + `projects/${projectId}/features/${featureId}/assets/`, payload)
	.subscribe( (resp) => {
		this.notificationsService.showSuccessToast('Import started!');
		//this.getFeatures(projectId)
	});
  }

  //Creates a new feature from an uploaded locally created feature
  uploadNewFeature(projectId: number, feature:Feature, path: string): void {
	let payload = feature;
	let response
	//Calls the addFeatureAsset route in GeoAPI, resp is a list of features
	this.http.post(environment.apiUrl + `projects/${projectId}/features/`, payload)
	.subscribe( (resp) => {
		//this.getFeatures(projectId)
		response = new Feature(resp[0])
		this.importImage(projectId, response, path)
	});
  }

  downloadGeoJSON(projectId: number, query: AssetFilters = new AssetFilters()) {
	const qstring: string = querystring.stringify(query.toJson());
	const downloadLink = document.createElement('a');

	this.http.get<FeatureCollection>(environment.apiUrl + `/projects/${projectId}/features/` + '?' + qstring)
	  .subscribe( (resp) => {
	const blob = new Blob([JSON.stringify(resp)], {type: 'application/json'});
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
	this.http.post<Array<Feature>>(environment.apiUrl + `/projects/${projectId}/features/files/`, form)
	  .subscribe( (feats) => {
	feats.forEach( (feat) => {
	  this.addFeature(new Feature(feat));
	});
	  }, error => {
	// TODO: Add notification
	  });
  }

  uploadAssetFile(projectId: number, featureId: number, file: File): void {
	const form: FormData = new FormData();
	form.append('file', file, file.name);
	this.http.post<Feature>(environment.apiUrl + `/api/projects/${projectId}/features/${featureId}/assets/`, form)
	.subscribe( (feature) => {
	  // TODO workaround to update activeFeature
	  let f = this._activeFeature.getValue();
	  if(f && f.id === featureId){
		this.activeFeature = new Feature(feature);
		this.getFeatures(projectId);
	  }
	}, error => {
	  // TODO: Add notification
	});
  }

  getOverlays(projectId: number): void {
	this.http.get(environment.apiUrl + `/projects/${projectId}/overlays/`).subscribe( (ovs: Array<Overlay>) => {
	  this._overlays.next(ovs);
	});
  }

  addOverlay(projectId: number, file: File, label: string, minLat: number, maxLat: number, minLon: number, maxLon: number) {
	const payload = new FormData();
	payload.append('file', file);
	payload.append('label', label);
	payload.append('minLat', minLat.toFixed(6));
	payload.append('maxLat', maxLat.toFixed(6));
	payload.append('minLon', minLon.toFixed(6));
	payload.append('maxLon', maxLon.toFixed(6));

	this.http.post(environment.apiUrl + `/projects/${projectId}/overlays/`, payload)
	  .subscribe((resp) => {
	this.getOverlays(projectId);
	  });
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
