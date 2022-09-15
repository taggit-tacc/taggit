import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { ProjectsService } from './projects.service';
import { Feature, NewGroup } from '../models/models';

// Will inject Projects and GeoData Service to get properties of Feature
@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  private _groups: BehaviorSubject<any> = new BehaviorSubject([]);
  public groups: Observable<any> = this._groups.asObservable();
  private _forms: BehaviorSubject<any> = new BehaviorSubject([]);
  public forms: Observable<any> = this._forms.asObservable();

  private _selectedImages: BehaviorSubject<Array<any>> = new BehaviorSubject([]);
  public selectedImages: Observable<Array<any>> = this._selectedImages.asObservable();

  private _showTagger: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public showTagger: Observable<boolean> = this._showTagger.asObservable();

  private _activeFeature: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public activeFeature: Observable<any> = this._activeFeature.asObservable();

  private _unselectAll: BehaviorSubject<boolean> = new BehaviorSubject(null);
  public unselectAll: Observable<boolean> = this._unselectAll.asObservable();

  private _featureImagesExist: BehaviorSubject<boolean> = new BehaviorSubject(
    null
  );

  private _showTagGenerator: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public showTagGenerator: Observable<boolean> = this._showTagGenerator.asObservable();

  private _tagFeatureGroup: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );
  public tagFeatureGroup: Observable<any> =
    this._tagFeatureGroup.asObservable();

  constructor() {}

  // Loop through projects to get a list of Groups
  addGroup(groupList: any): void {
    this._groups.next(groupList);
  }

  imageSelected(feature: Feature): boolean {
    const currentFeatures = this._selectedImages.value;
    return currentFeatures.some(feat => feat.id === feature.id)
  }

  unselectAllImages() {
    this._selectedImages.next([]);
  }

  toggleImageSelect(feature: Feature): void {
    const currentFeatures = this._selectedImages.value;
    const newFeatures = this.imageSelected(feature)
      ? currentFeatures.filter(feat => feat.id !== feature.id)
      : [feature, ...currentFeatures];

    this._selectedImages.next(newFeatures);
  }

  addForm(formList: any): void {
    this._forms.next(formList);
  }

  setSelectedImages(selectedImages: any): void {
    this._selectedImages.next(selectedImages);
  }

  toggleTagger(): void {
    this._showTagger.next(!this._showTagger.value);
  }

  setActiveProject(feat: any): void {
    this._activeFeature.next(feat);
  }

  setShowTagGenerator(value: boolean): void {
    this._showTagGenerator.next(value);
  }
}
