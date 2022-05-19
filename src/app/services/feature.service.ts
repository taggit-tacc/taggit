import { Injectable } from '@angular/core';
import { Feature, FeatureCollection} from '../models/models';
import { BehaviorSubject, Observable } from 'rxjs';
import { GeoDataService } from './geo-data.service';
import { FormsService, tags } from './forms.service';

@Injectable({
  providedIn: 'root'
})
export class FeatureService {
  private featureCollection: FeatureCollection;
  private _features: BehaviorSubject<FeatureCollection>;
  public features$: Observable<FeatureCollection>;
  private _tags: BehaviorSubject<Array<Object>>;
  public tags$: Observable<Array<Object>>;
  private tagList: Array<Object> = [];

  constructor(private geoDataService: GeoDataService,
              private formsService: FormsService,) {
    this._features = new BehaviorSubject<FeatureCollection>({type: 'FeatureCollection', features: []});
    this.features$ = this._features.asObservable(); 

    this._tags = new BehaviorSubject<Array<Object>>( [] );
    this.tags$ = this._tags.asObservable();

    this.geoDataService.features.subscribe( (fc: FeatureCollection) => {
      this._features.next(fc)
      this.featureCollection = fc
      console.log(this.featureCollection)

      //Update the tag list alongside the features
      try {
        if( this.tagList == [] ) { //Only update if tagList is empty, after retrieval, the only way to edit tags will be to edit this list
            this.tagList = this.featureCollection.features[0].properties.tag
            this._tags.next( this.tagList )
        }
      } catch (error) {}
      });
  }

  //This has to manage all features, tags, and maybe groups as well. While I think that groups service has all the methodology,
  //the input for all that is features done by the local lists 

  //Takes the feature to be deleted, and filters it out of the feature list
  deleteFeature(feat:Feature): void {
    this.featureCollection.features = this.featureCollection.features.filter(featListfeat => featListfeat.id != feat.id)
    this._features.next(this.featureCollection)  //Update the observable
    //this.saveFeatures(this.featureCollection) //Save features to backend
    this.geoDataService.deleteFeature(feat)
  }

  //Takes a list of features, and deletes them from the observable in a more efficient manner
  bulkFeatureDelete(delFeats:Array<Feature>): void {
    delFeats.forEach(feat => {
      //Filter out every feature in delFeats from the master list
      this.featureCollection.features = this.featureCollection.features.filter(featListFeature => featListFeature.id != feat.id)
      this.geoDataService.deleteFeature(feat)
    })
    this._features.next(this.featureCollection)  //Update the observable with the filtered list
    //this.saveFeatures(this.featureCollection) //Save features to backend
  }

  //saveFeatures takes a feature list and passes it to GeoAPI to save
  //With this scheme, you can just update a feature's property
  saveFeatures(features:FeatureCollection): void {
    this._features.next(features)  //Update the observable
    features.features.forEach(feat => {
      this.geoDataService.updateFeatureProperty(feat.project_id, Number(feat.id), feat.properties)
    })
  }

  //This might be a little short to consider a function, but it saves me from writing it every time...
  //Assumes that the feature passed in has had it's properties updated or changed before being passed in
  saveFeature(feat:Feature): void {
    this.geoDataService.updateFeatureProperty(feat.project_id, Number(feat.id), feat.properties)
  }

  //Takes a feature, and optionally an updated property section
  //If featprop is null, it assumes the passed in feature was already updated with the new properties

  updateFeatureProperties(feature:Feature, featProp=null): void {
    //If featprop has a value, update the feature's properties to the new section
    if( featProp != null) {
      feature.properties = featProp
    }
    //Update and save the list
    this.featureCollection.features.forEach(feat => {
      if(feat.id == feature.id){
        feat = feature
      }
    })
    this.saveFeature(feature)
  }
  
  //Update Styles takes an object defining new style options and the feature they should be connected with
  updateStyle(feature:Feature, style): void {
    //Update and save the list
    this.featureCollection.features.forEach(feat => {
      if(feat.id == feature.id){
        feat.styles = style
      }
    })
    this.geoDataService.updateFeatureStyle(feature.project_id, Number(feature.id), feature.properties)
  }

  //Save tags has 2 purposes, first it updates every feature's tag list to reflect the change, then it sends the features to GeoAPI to be saved
  saveTags(tagList): void {
    this._tags.next(this.tagList) //Update the observable
    //Update each feature's tag list
    this.featureCollection.features.forEach(feat => {
      feat.properties.tag = tagList
    });
    this.saveFeatures(this.featureCollection) //Save updated features to backend
  }

  //Takes the entire tag that should be deleted and filters the list from it
  deleteTag(tag): void {
    this.tagList = this.tagList.filter(listTag => listTag != tag)
    this._tags.next(this.tagList) //Update the observable
    this.saveTags(this.tagList) //saves tags to backend
  }

  bulkTagDelete(tagList: Array<any>): void {
    tagList.forEach( delTag => {
      //Filter out each tag from the tag list
      this.tagList = this.tagList.filter(listTag => listTag != delTag)
    })
    this._tags.next(this.tagList) //Update the observable with the filtered list
    this.saveTags(this.tagList) //saves tags to backend
  }

  createTag(groupList: Array<any>, activeGroup: string, newTag: tags): void {
    let payload
    let groupFeature
    groupList.forEach(group => {

      if (group.name == activeGroup){
          
        groupFeature = group.features
        
        //Create a temporary group with a copy of the current groups information
        let tempGroup = [{
          name: group.name,
          color: group.name,
          icon: group.icon
        }]

        payload = {
          group: tempGroup,
          style: {
            faIcon: group.icon,
            color: "#00C8FF"
          },
          tag:[]
        }}
    }) // end of groupList.forEach 

    for (let feat of groupFeature){
      if(feat.properties.tag != undefined || feat.properties.tag != []){

				if(feat.properties.group.length > 1){
					feat.properties.group.forEach(group => {
						if(group.name != activeGroup){
							let tempGroup = {
								name: group.name,
								color: group.color,
								icon: group.icon
							}
						payload.group.push(tempGroup)


					}
						
					});
				} // end of if length statement
				else {
					payload.group = []
					feat.properties.group.forEach(group => {
						if(group.name == activeGroup){
							let tempGroup = {
								name: group.name,
								color: group.color,
								icon: group.icon
							}
						payload.group.push(tempGroup)
					}});
				}

        newTag.feature = feat.id
        // payload.tag = this.tagList
        payload.tag = this.formsService.getTags();
        this.formsService.saveTag(activeGroup, newTag, newTag.label)
        this.geoDataService.updateFeatureProperty(feat.project_id, Number(feat.id), payload)
        // this.saveFeature(feat)

        payload.tag = []
			} // end of if undefined statement
    } // end of for loop
  } // end of createTag

  removeTag(oldTag: tags[], groupName: string, tag: tags, groupList: Array<any>, activeGroup: string): tags[]{
    while(true){
      const index = oldTag.findIndex(item => item.groupName === groupName && item.label === tag.label && item.type === tag.type);
      // delete this.exampleNote[index];
      if (index > -1) {
      oldTag.splice(index, 1);
      }else{
        break;
      }
    } // end of while loop

    let payload
    let groupFeature
    groupList.forEach(group => {
      if (group.name == activeGroup) {
        groupFeature = group.features;
    
        //Creates a temporary group with a copy of the current groups info
        let tempGroup = [{
            name: group.name,
            color: group.color,
            icon: group.icon
          }]
          
          //And adds the temp group to a payload along with the necessary style infromation
        payload = {
          group: tempGroup,
          style: {
            faIcon: group.icon,
            color: '#00C8FF'
          },
          tag: []
        }// end of payload
      } // end of if activeGroup statement
    }); // end of groupList.forEach
    
    for (let feat of groupFeature){

			if(feat.properties.tag != undefined || feat.properties.tag != []){
				feat.properties.group.forEach(group => {
					if(feat.properties.group.length > 1){
						if(group.name != activeGroup){
							let tempGroup = {
								name: group.name,
								color: group.color,
								icon: group.icon
							}
						payload.group.push(tempGroup)}
					}
					else {
						payload.group = []
						if(group.name == activeGroup){
							let tempGroup = {
								name: group.name,
								color: group.color,
								icon: group.icon
							}
						payload.group.push(tempGroup)}
					}
			});
			} 
			
			payload.tag = oldTag;

			this.geoDataService.updateFeatureProperty(feat.project_id, Number(feat.id), payload)
			this.geoDataService.getFeatures(feat.project_id)
			payload.tag = []
		}
    return oldTag
  } // end of removeTag
}