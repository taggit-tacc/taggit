import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable, ReplaySubject, Subject} from 'rxjs';
import { ProjectsService } from './projects.service';
import { Feature } from '../models/models';

// Will inject Projects and GeoData Service to get properties of Feature
@Injectable({
  providedIn: 'root'
})
export class GroupsService {
  private _groups: BehaviorSubject<any> = new BehaviorSubject([]);
  public groups: Observable<any> = this._groups.asObservable();
  private _forms: BehaviorSubject<any> = new BehaviorSubject([]);
  public forms: Observable<any> = this._forms.asObservable();
  private _tempGroup: BehaviorSubject<any> = new BehaviorSubject([]);
  public tempGroup: Observable<any> = this._tempGroup.asObservable();
  private _showGroup: BehaviorSubject<boolean> = new BehaviorSubject(null);
  public showGroup: Observable<boolean> = this._showGroup.asObservable();
  private _showSidebar: BehaviorSubject<boolean> = new BehaviorSubject(null);
  public showSidebar: Observable<boolean> = this._showSidebar.asObservable();

  private _activeFeature: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public activeFeature: Observable<any> = this._activeFeature.asObservable();

  private _activeGroup: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  public activeGroup: Observable<string> = this._activeGroup.asObservable();

  private _activeFeatureNum: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public activeFeatureNum: Observable<number> = this._activeFeatureNum.asObservable();

  private _unselectAll: BehaviorSubject<boolean> = new BehaviorSubject(null);
  public unselectAll: Observable<boolean> = this._unselectAll.asObservable();

  private _featureImagesExist: BehaviorSubject<boolean> = new BehaviorSubject(null);
  public featureImagesExist: Observable<boolean> = this._featureImagesExist.asObservable();

  private _activeFeatureId: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public activeFeatureId: Observable<number> = this._activeFeatureId.asObservable();

  private _activePane: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  public activePane: Observable<string> = this._activePane.asObservable();

  private _tagFeatureGroup: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public tagFeatureGroup: Observable<any> = this._tagFeatureGroup.asObservable();

  private _itemsSelected: BehaviorSubject<boolean> = new BehaviorSubject(null);
  public itemsSelected: Observable<boolean> = this._itemsSelected.asObservable();

  constructor() {
  }

  // Loop through projects to get a list of Groups
  addGroup(groupList: any): void {
	this._groups.next(groupList);
  }

  setGroupProperties(featureList: any): void {
	// let tempGroupList = {};
	const tempGroupList = {};
	const tempFeatList = {};
	for (const feat of featureList) {
	  // Parses if group exists at all in server
	  if (feat.properties.group) {
		// Loops through all the groups
		for (const group of feat.properties.group) {
		  // Adds new feature to group
		  // if (!tempFeatList[group.name]) {
		  // 	tempFeatList[group.name] = [];
		  // }

		  // if (!tempGroupList[group.name]) {
		  // 	tempGroupList[group.name] = [];
		  // }

		  // TODO for some reason it's limiting itself to only one group per feature...

		  // if it exist
		  if (!tempGroupList[group.name]) {

			tempGroupList[group.name] = {
			  name: group.name,
			  features: [],
			  color: group.color,
			  icon: group.icon
			};
		  }
		//   console.log(tempGroupList[group.name].features)
		  const index = tempGroupList[group.name].features.findIndex(item => (item == feat));
		  if (index == -1) {
		  tempGroupList[group.name].features.push(feat);
		  }


		}
	  }
	}

	// console.log(tempGroupList);
	this._groups.next(Object.values(tempGroupList));
	// console.log(Object.values(tempGroupList))
	// this._groups.next(tempGroupList);
  }

  addForm(formList: any): void {
	this._forms.next(formList);
  }

  addTempGroup(tempGroup: any): void {
	this._tempGroup.next(tempGroup);
  }

  setShowGroup(show: boolean): void {
	this._showGroup.next(show);
  }

  setFeatureImagesExist(feature: boolean): void {
	this._featureImagesExist.next(feature);
  }

  setShowSidebar(show: boolean): void {
	this._showSidebar.next(show);
  }

  setUnselectAll(select: boolean): void {
	this._unselectAll.next(select);
	this._itemsSelected.next(!select);
  }

  setItemsSelected(select: boolean): void {
	this._itemsSelected.next(select);
  }

  // TODO Replace this with geo-data.service
  setActiveProject(feat: any): void {
	this._activeFeature.next(feat);
  }

  setActiveGroup(groupName: string): void {
	// console.log(feat.assets[0].path);
	this._activeGroup.next(groupName);
  }

  setActivePane(pane: string): void {
	// console.log(feat.assets[0].path);
	this._activePane.next(pane);
  }

  setActiveFeatureNum(num: number): void {
	this._activeFeatureNum.next(num);
  }

  setActiveFeatureId(id: number): void {
	this._activeFeatureId.next(id);
  }

  setTagFeatureGroup(groupName: string, featureId: number, payload: any): void {
	const groupFeature: string = groupName + featureId;
	let tagFeatureGroupValue: any = this._tagFeatureGroup.value;

	if (tagFeatureGroupValue == null) {
	  tagFeatureGroupValue = {};
	} else {
	  tagFeatureGroupValue[groupFeature] = payload;
	}

	this._tagFeatureGroup.next(tagFeatureGroupValue);
  }
}
