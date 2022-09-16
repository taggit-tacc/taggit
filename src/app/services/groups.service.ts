import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { ProjectsService } from './projects.service';
import { Feature } from '../models/models';

// Will inject Projects and GeoData Service to get properties of Feature
@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  private _selectedImages: BehaviorSubject<Array<any>> = new BehaviorSubject([]);
  public selectedImages: Observable<Array<any>> = this._selectedImages.asObservable();

  private _showTagger: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public showTagger: Observable<boolean> = this._showTagger.asObservable();

  private _showTagGenerator: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public showTagGenerator: Observable<boolean> = this._showTagGenerator.asObservable();

  constructor() {}

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

  setSelectedImages(selectedImages: any): void {
    this._selectedImages.next(selectedImages);
  }

  toggleTagger(): void {
    this._showTagger.next(!this._showTagger.value);
  }

  setShowTagGenerator(value: boolean): void {
    this._showTagGenerator.next(value);
  }
}
