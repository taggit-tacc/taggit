import { Injectable } from '@angular/core';
import { Feature, FeatureCollection} from '../models/models';
import { BehaviorSubject, Observable } from 'rxjs';
import { GeoDataService } from './geo-data.service';
import { FormsService, tags } from './forms.service';
import { feature } from '@turf/turf';
import { AbstractEmitterVisitor } from '@angular/compiler/src/output/abstract_emitter';

@Injectable({
  providedIn: 'root'
})
export class FeatureService {
  private featureCollection: FeatureCollection;
  private _features: BehaviorSubject<FeatureCollection>;
  public features$: Observable<FeatureCollection>;
  private _tags: BehaviorSubject<tags[]>;
  public tags$: Observable<tags[]>;
  private tagList: tags[];

  constructor(private geoDataService: GeoDataService,
              private formsService: FormsService) {
    this._features = new BehaviorSubject<FeatureCollection>({type: 'FeatureCollection', features: []});
    this.features$ = this._features.asObservable(); 

    this._tags = new BehaviorSubject<tags[]>( [] );
    this.tags$ = this._tags.asObservable();

    this.geoDataService.features.subscribe( (fc: FeatureCollection) => {
      this._features.next(fc)
      this.featureCollection = fc
      // console.log(this.featureCollection)

      //Update the tag list alongside the features
      try {
        if( this.tagList == undefined ) { //Only update if tagList is empty, after retrieval, the only way to edit tags will be to edit this list
            this.tagList = this.formsService.getTags()
            this._tags.next( this.tagList )
        }
      } catch (error) {}
      });
  }

  //Takes the feature to be deleted, and filters it out of the feature list
  deleteFeature(feat:Feature): void {
    this.featureCollection.features = this.featureCollection.features.filter(featListfeat => featListfeat.id != feat.id)
    this._features.next(this.featureCollection)  //Update the observable
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
  }

  //saveFeatures takes a feature list and passes it to GeoAPI to save
  //With this scheme, you can just update a feature's property
  saveFeatures(features:FeatureCollection): void {
    this._features.next(features)  //Update the observable
    features.features.forEach(feat => {
      this.geoDataService.updateFeatureProperty(feat.project_id, Number(feat.id), feat.properties)
    })
    this.geoDataService.getFeatures(features.features[0].project_id)
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
    this._tags.next(tagList) //Update the observable
    let customList = []
    //Update each feature's tag list
    this.featureCollection.features.forEach(feat => {
      
      tagList.forEach(tag => {
        if (feat.id == tag.feature){
          customList.push(tag)
        }}) //end of for each tag

      feat.properties.tag = customList
      customList = []
    });
    this.saveFeatures(this.featureCollection) //Save updated features to backend
  }

  //Takes the entire tag that should be deleted and filters the list from it
  //NOTE: This does sucessfully delete multiple tags at a time, just not if you delete multiple and immediately reload...
  deleteTag(tag:tags): void {
    //If groupname and label of the passed in tag match, remove from list
    let tempTags = []
    this.tagList.forEach( (listTag) => {
      if( !((listTag.groupName == tag.groupName) && (listTag.label == tag.label) && (listTag.type == tag.type) ) ){
        tempTags.push(listTag)
      }
    })
    this.tagList = tempTags
    this.saveTags(this.tagList) //saves tags to backend
  }

  renameTag(tag:tags, newName:string): void {
    let oldName = tag.label //The passed in tag has the old tag's name

    this.tagList.forEach( listTag => {
      if( (listTag.label == oldName) && (listTag.type == tag.type) ) {
        listTag.label = newName
      }
    })

    this.saveTags(this.tagList) //saves tags to backend
  }

  createTag(newTag:tags, activeGroup:string, groupList: Array<any>): void {

    this.featureCollection.features.forEach( listFeature => { //Loop through every feature in the project
      if(listFeature.properties.group) {
        listFeature.properties.group.forEach( group => { //Loop through every group attached to the feature
          //NOTE: While it is tempting to just edit the passed in tag, this causes a strange glitch
          if( group.name == activeGroup ) {
            let tag:tags = {
              extra:newTag.extra,
              feature: listFeature.id,
              groupName: newTag.groupName,
              label: newTag.label,
              options: newTag.options,
              type: newTag.type
            }
            this.tagList.push(tag)
          } // end of if statement
        }) // end of for each group 
      } // end of if prop group
    }) // end of for each listFeature

    this.saveTags(this.tagList)
  } // end of creatTag function

  bulkTagDelete(tagList: Array<any>): void {
    tagList.forEach( delTag => {
      //Filter out each tag from the tag list
      this.tagList = this.tagList.filter(listTag => listTag != delTag)
    })
    this.saveTags(this.tagList) //saves tags to backend
  }

  updateExtra(change:any, componentID: number, feature: number, groupName:string, label:string, type:string): void{
    let nOption
    this.tagList.forEach( tag => {
      // updating notes
      if(tag.feature === feature && tag.groupName === groupName && tag.type === type){
        const index = tag.extra.findIndex(item => item['id'] === feature && item['compID'] === componentID && item['groupName'] === groupName  && item['label'] === label);
						// const index = tag.extra.findIndex(item => item.label === opt['label'] && item.id === id && item.group === group)

						if(index > -1){
							// console.log(tag.extra)
							// console.log(tag.extra[index])
							tag.extra[index]['option'] = change
						}
						else{
              
							nOption = {option: change, id: feature, groupName: groupName, compID: componentID, label:label} 
							// console.log(rOption)
							tag.extra.push(nOption);
						}
      } // end of updating notes



    }) // end of for each tag
    this.saveTags(this.tagList)
  } // end of updateExtra function

  updateChecked(opt:object, id: number, group: string, label:string, check:string): void{
    let nOption 
    this.tagList.forEach( tag => {
      if(check == "create"){
        if(tag != undefined){
            if(tag.feature === id && tag.groupName === group){
              nOption = { option: opt['key'], id: id , group: group, label: label}
              console.log(nOption)
              tag.extra.push(nOption)
            }
        }
      } // end of create
      else{
        if(tag.feature === id && tag.groupName === group){
          const index = tag.extra.findIndex(item => item['option'] === opt['key'] && item['id'] === id &&  item['group'] === group && item['label'] === label)
          // item.label === opt['label'] && item.id === id && item.group === group && item.title === label
          tag.extra.splice(index,1)
        }
      } // end of else
    }) // end of for each tag
    this.saveTags(this.tagList)
  } // end of updateChecked function
}