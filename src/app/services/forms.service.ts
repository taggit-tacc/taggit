import { Component, Injectable } from '@angular/core';
import {BehaviorSubject, Observable, ReplaySubject, Subject} from 'rxjs';
import {Group} from '../models/models';
import { map, first } from 'rxjs/operators';
import { GroupsService } from './groups.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ProjectsService } from './projects.service';
import { GeoDataService } from './geo-data.service';
import { prepareSyntheticListenerFunctionName } from '@angular/compiler/src/render3/util';
import { fadeInItems } from '@angular/material';
import { Feature, FeatureCollection } from 'geojson';

@Injectable({
  providedIn: 'root'
})
export class FormsService {
  // private _forms: BehaviorSubject<any[]> = new BehaviorSubject([]);
  // public forms: Observable<any[]> = this._forms.asObservable();

  // private _forms: BehaviorSubject<Group[]> = new BehaviorSubject([]);
  // public forms: Observable<Group[]> = this._forms.asObservable();

  // private _forms: BehaviorSubject<Group[]> = new BehaviorSubject([]);
  // public forms: Observable<Group[]> = this._forms.asObservable();

  // private _forms: BehaviorSubject<Group> = new BehaviorSubject([]);
  // private _forms: BehaviorSubject<Group> = new BehaviorSubject<Group>({Type});
  // this._features = new BehaviorSubject<FeatureCollection>({type: 'FeatureCollection', features: []});

  // this._features = new BehaviorSubject<FeatureCollection>({type: 'FeatureCollection', features: []});

  private _forms: BehaviorSubject<Group[]> = new BehaviorSubject([]);
  public forms: Observable<Group[]> = this._forms.asObservable();

  private _activeFormList: BehaviorSubject<any[]> = new BehaviorSubject([]);
  public activeFormList: Observable<any[]> = this._activeFormList.asObservable();

  private _formGroup: BehaviorSubject<FormGroup> = new BehaviorSubject<FormGroup>(null);
  public formGroup: Observable<FormGroup> = this._formGroup.asObservable();

  

  private activeGroup
  private groupList
  private featureList: Array<any> = [];
  features: FeatureCollection;
  private selectedProject
  private selectedFeatureID
  private selectedFeature
  tempGroup: Array<Feature>;
  // THIS TODO
  // private _forms: BehaviorSubject<Group> = new BehaviorSubject<Group>({type: 'Group', formList: [], groupName: []});
  // public forms: Observable<Group> = this._forms.asObservable();


  constructor(private groupsService: GroupsService,
			  private projectsService: ProjectsService,
			  private geoDataService: GeoDataService) {

				this.groupsService.activeGroup.subscribe((next) => {
					this.activeGroup = next;
				});
			
				this.groupsService.groups.subscribe((next) => {
					this.groupList = next;
				});
			
				this.projectsService.activeProject.subscribe(next => {
					this.selectedProject = next;
				});
			
				this.groupsService.activeFeatureId.subscribe(next => {
					this.selectedFeatureID = next
				})

				this.groupsService.activeFeature.subscribe(next => {
					this.selectedFeature = next
				});
				this.geoDataService.features.subscribe( (fc: FeatureCollection) => {
					this.features = fc;
			  
					if (this.features != undefined) {
					  this.featureList = this.features.features;
					}
				  });
			  }

  // getProjects(): void {
  //  this.http.get<Project[]>(environment.apiUrl + `/projects/`).subscribe( resp => {
  //    this._projects.next(resp);
  //  });
  // }

  // addForm(formList: Array<any>): void {
  //	this._forms.formList.next(formList);
  // }

  // addForm(formObj: Group[]): void {
  // TODO This should be stored in projects api later on (or not)
  // addForm(groupName: string, formGroup: Group, formList: Array<any>): void {
  // addForm(formObj: Array<Group>): void {
  addForm(groupName: string, formItem: any): void {
	this.forms.pipe(
	  first(),
	  map(groupList => {
		return groupList.map(groupObj => {
		  if (groupObj.groupName == groupName) {
			groupObj.formList.push(formItem);
		  }
		  return groupObj;
		});
	  })).subscribe(current => {this._forms.next(current);/*console.log("AYA"); console.log(this._forms); console.log(current)*/});


	this.changeGroupForm(groupName);
  }

  updateFormItem() {
	let group: any = {};

	if (this._activeFormList.value) {
	  this._activeFormList.value.forEach(e =>
		group[e.label] = e.required ? new FormControl(e.value || '', Validators.required)
		: new FormControl(e.value || '')
										);

	  this._formGroup.next(new FormGroup(group));
	}
  }

  changeGroupForm(groupName: string) {
	this.forms.pipe(
	  first(),
	  map(groupList => groupList.map(groupObj => {
		if (groupObj.groupName == groupName) {
		  return groupObj.formList;
		}
	  }))).subscribe(current => {this._activeFormList.next(current.find(e => e != undefined))});

	this.updateFormItem();
  }

  checkDefault(selectedColor:string){
	if(selectedColor === "default") {
		try {
			selectedColor = this.selectedFeature.properties.style.color
		} catch (error) {
			selectedColor = "#00C8FF"
		}
	}
	return selectedColor
  }

  //Inputs:
  //color:string A 7 digit hexadecimal string (#RRGGBB) passed in from a color tag
  //This method accesses group services to retrive the current group's icon as well
  saveStyles(selectedColor:string, currentID:number){
	let icon:string
	let payload

	//A check to see if the color isn't supposed to be changed
	selectedColor = this.checkDefault(selectedColor)

	//Cycles through each group until it finds one that matches the active group
	this.groupList.forEach(group => {
		if ((group.name === this.activeGroup)) {
			icon = group.icon

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
					faIcon: icon,
					color: selectedColor
				}
			}
		}
	});

	console.log(payload)
	//Finally, sends the payload and projectID to GeoAPI to update the feature
	this.geoDataService.updateFeatureProperty(this.selectedProject.id, currentID ,payload)
  }

  addGroup(groupName: string) {
	let groupObject = new Group();
	groupObject.formList = [];

	groupObject.groupName = groupName;

	this.forms.pipe(
	  first()
	).subscribe(current => {
		current.push(groupObject);
		this._forms.next(current);
	});
  }

  deleteForm(groupName: string, form: any) {
	this.forms.pipe(
	  first(),
	  map(groupList => groupList.map(groupObj => {
		if (groupObj.groupName == groupName) {
		  groupObj.formList = groupObj.formList.filter(formItem => formItem.label != form.label);
		}
		return groupObj
	  }))).subscribe(current => this._forms.next(current));

	this.forms.pipe(
	  first(),
	  map(groupList => groupList.map(groupObj => {
		if (groupObj.groupName == groupName) {
		  return groupObj.formList.filter(formItem => formItem.label != form.label);
		}
	  }))).subscribe(current => {this._activeFormList.next(current.find(e => e != undefined))});

	this.changeGroupForm(groupName);
  };

  renameForm(groupName: string, form: any, label: string) {
	this.forms.pipe(
	  first(),
	  map(groupList => groupList.map(groupObj => {
		if (groupObj.groupName == groupName) {
		  groupObj.formList.forEach(formItem => {
			if (formItem.label == form.label) {
			  formItem.label = label;
			}
		  });
		}
		return groupObj
	  }))).subscribe(current => {this._forms.next(current);});

	this.forms.pipe(
	  first(),
	  map(groupList => groupList.map(groupObj => {
		if (groupObj.groupName == groupName) {
		  groupObj.formList.forEach(formItem => {
			if (formItem.label == form.label) {
			  formItem.label = label;
			}
		  });
		}
		return groupObj.formList;
	  }))).subscribe(current => {this._activeFormList.next(current.find(e => e != undefined))});

	this.changeGroupForm(groupName);
  }

  renameOption(groupName: string, opt: any, form: any, label: string) {
	this.forms.pipe(
	  first(),
	  map(groupList => groupList.map(groupObj => {
		if (groupObj.groupName == groupName) {
		  groupObj.formList.forEach(formItem => {
			if (formItem.label == form.label) {
			  formItem.options.forEach(option => {
				if (option.label == opt.label) {
				  option.label = label;
				}
			  });
			}
		  });
		}
		return groupObj;
	  }))).subscribe(current => this._forms.next(current));

	this.forms.pipe(
	  first(),
	  map(groupList => groupList.map(groupObj => {
		if (groupObj.groupName == groupName) {
		  groupObj.formList.forEach(formItem => {
			if (formItem.label == form.label) {
			  formItem.options.forEach(option => {
				if (option.label == opt.label) {
				  option.label = label;
				}
			  });
			}
		  });
		// return groupList;
		}
		return groupObj.formList;
	  }))).subscribe(current => {this._activeFormList.next(current.find(e => e != undefined))});
	  // }))).subscribe(current => {console.log(current.find(e => e != undefined))});

	this.changeGroupForm(groupName);
  }

  deleteOption(groupName: string, opt: any, form: any) {
	this.forms.pipe(
	  first(),
	  map(groupList => groupList.map(groupObj => {
		if (groupObj.groupName == groupName) {
		  groupObj.formList.forEach(formItem => {
			if (formItem.label == form.label) {
			  formItem.options = formItem.options.filter(option => option.label != opt.label);
			}
		  });
		}
		return groupObj;
	  }))).subscribe(current => {this._forms.next(current)});

	this.forms.pipe(
	  first(),
	  map(groupList => groupList.map(groupObj => {
		if (groupObj.groupName == groupName) {
		  groupObj.formList.forEach(formItem => {
			if (formItem.label == form.label) {
			  formItem.options = formItem.options.filter(option => option.label != opt.label);
			}
		  });
		}
		return groupObj.formList;
	  }))).subscribe(current => {this._activeFormList.next(current.find(e => e != undefined))});

	this.changeGroupForm(groupName);
  }

  getForm(groupName: string, formObj: Array<Group>): Array<any> {
	let groupObj = formObj.filter(groupObj => groupObj.groupName === groupName);
	let finalArray = [];

	if (groupObj[0] != undefined) {
	  finalArray = groupObj[0].formList;
	}

	return finalArray;
  }

  userTag: tags = {type: "text", groupName: "car", label:"Title", options: [], feature: "", extra: []};
  tagData = []
  checkedOptions = []
  chosenTag = [{option:"", id: 0},"",""]; //chosen option of both Radio Buttons and Color tags. Radio info is stored at [0], Color at [1]
  notebook = []; //Var for storing note tags

  saveTag(gName: string, tag: tags, tLabel: string): void{
	const index = this.tempData.findIndex(item => item.groupName === gName  && item.label === tLabel && item.feature === tag.feature);

	if (index > -1) {
		// console.log("IT WORKED")
		this.tempData[index].label = tag.label;
		// this.tagData[index].options = tag.options;
	}
	else {
		tag.groupName = gName;
		this.tempData.push(tag);
		// console.log("IT WORKED")
		// this.geoDataService.updateFeatureProperty()
		// console.log("Tag data:")
		// console.log(this.tagData)
	}
}

tempData = [];
getTags(): tags[]{
	this.tempData = [];
	let count = 0
	// console.log(this.tempData)
	this.tempData = this.tagData
	// console.log(this.tempData)
	// console.log(this.tagData)
	for (let feat of this.featureList){
		//   console.log(typeof(feat.properties.tag))
		  if(feat.properties.tag != undefined){
			  feat.properties.tag.forEach(tag => {
				//   console.log(tag)
				//   console.log(this.tempData)
				const index = this.tempData.findIndex(item => item.groupName === tag.groupName  && item.label === tag.label && item.feature === tag.feature);
				// console.log(index)

				if(index == -1){
					// count += 1
					this.tempData.push(tag)
				}
			  });
		  }
	  }
	// console.log(this.tagData)
	// console.log(this.tempData)
	// console.log(count)
	return this.tempData;
}

newTag: object[] = [];
deleteTag(gName: string, tag: tags): void{
    // for (let tag in this.tagData){
	// 	const index = this.tagData.findIndex(item => item.groupName === gName && item.label === tLabel);
	// 	// if(tag['groupName'] === gName && tag['label'] === tLabel)
	// 	console.log(tag)
	// 	if (index > -1) {
	// 	// delete this.exampleNote[index];
	// 	this.tagData.splice(index, 1);
	// 	}
	// }
	let data = this.tempData;
	while(true){
		const index = data.findIndex(item => item.groupName === gName && item.label === tag.label && item.type === tag.type);
		// delete this.exampleNote[index];
		if (index > -1) {
		data.splice(index, 1);
		}else{
			break;
		}
	}

	this.tempData = data;

	let icon:string
	let payload
	this.groupList.forEach(group => {
		if (group.name == this.activeGroup) {
			this.tempGroup = group.features;
				icon = group.icon
	
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
						faIcon: icon,
						color: '#00C8FF'
					},
					tag: []
				}
				// console.log(payload.tag)
			
		}
		});

		// console.log(this.tempGroup)
		for (let feat of this.tempGroup){

			if(feat.properties.tag != undefined || feat.properties.tag != []){
				// feat.properties.tag.forEach(tag => {
				//   this.newTag.push(tag)
				// });
				// console.log(feat.properties)
				// console.log(this.activeGroup)
				feat.properties.group.forEach(group => {
					if(group.name != this.activeGroup){
						let tempGroup = {
							name: group.name,
							color: group.color,
							icon: group.icon
						}
					payload.group.push(tempGroup)}
				});
			} 
			
			// console.log(data)
			payload.tag = data;
			// console.log(payload.tag)

			//   console.log(typeof(feat.properties.tag))
			// if(feat.properties.tag != undefined){
			// 	feat.properties.tag.forEach(tTag => {
			// 		console.log(tTag)
			// 		console.log(tag)
			// 		// console.log(tTag != tag)
			// 		console.log((tTag.groupName === tag.groupName &&  tTag.label === tag.label &&  tag.type === tag.type))
			// 		if((tTag.groupName === tag.groupName && tTag.label === tag.label &&  tag.type === tag.type)){
			// 		// this.newTag.push(tTag)
			// 		}
			// 		else{
			// 			payload.tag.push(tTag)
			// 		}
			// 	});

			// 	// payload.tag.push(this.newTag)
				
			// 	// console.log(payload)
			// 	// this.newTag = []
			// }
			this.geoDataService.updateFeatureProperty(this.selectedProject.id, Number(feat.id), payload)
			payload.tag = []
		}
	// this.newTag = []
}

deleteGroupTags(gName:string): void {

	let data = this.tempData;
	while(true){
		const index = data.findIndex(item => item.groupName === this.activeGroup);
		// delete this.exampleNote[index];
		if (index > -1) {
		data.splice(index, 1);
		}else{
			break;
		}
	}
	this.tempData = data;

	let icon:string
	let payload
	this.groupList.forEach(group => {
		if (group.name == this.activeGroup) {
			this.tempGroup = group.features;
				icon = group.icon
	
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
						faIcon: icon,
						color: '#00C8FF'
					},
					tag: []
				}
				// console.log(payload.tag)
			
		}
		});


	console.log(this.tempGroup)
	for (let feat of this.tempGroup){

		if(feat.properties.tag != undefined || feat.properties.tag != []){
			// feat.properties.tag.forEach(tag => {
			//   this.newTag.push(tag)
			// });
			// console.log(feat.properties)
			// console.log(this.activeGroup)
			feat.properties.group.forEach(group => {
				if(group.name != this.activeGroup){
					let tempGroup = {
						name: group.name,
						color: group.color,
						icon: group.icon
					}
				payload.group.push(tempGroup)}
			});
		} 
		
		console.log(data)
		payload.tag = data;
		// console.log(payload.tag)

		//   console.log(typeof(feat.properties.tag))
		// if(feat.properties.tag != undefined){
		// 	feat.properties.tag.forEach(tTag => {
		// 		console.log(tTag)
		// 		console.log(tag)
		// 		// console.log(tTag != tag)
		// 		console.log((tTag.groupName === tag.groupName &&  tTag.label === tag.label &&  tag.type === tag.type))
		// 		if((tTag.groupName === tag.groupName && tTag.label === tag.label &&  tag.type === tag.type)){
		// 		// this.newTag.push(tTag)
		// 		}
		// 		else{
		// 			payload.tag.push(tTag)
		// 		}
		// 	});

		// 	// payload.tag.push(this.newTag)
			
		// 	// console.log(payload)
		// 	// this.newTag = []
		// }
		this.geoDataService.updateFeatureProperty(this.selectedProject.id, Number(feat.id), payload)
		payload.tag = []
	}
}

optData = []
deleteOpt(gName:string, opt:object, tag: tags): void {
	const index = this.optData.findIndex(item => item.groupName === gName && item.label === tag.label);
	if (index > -1) {
		const ind = this.optData[index].options.findIndex(item => item === opt)
		if (ind > -1){
			this.optData[index].options.splice(ind,1);
		}
	}

}

addCheckedOpt(opt:object, id: number, group: string, label:string): void {
	let option = { key: opt['key'], label: opt['label'], choice: opt['key'], id: id , group: group, title: label}
	this.checkedOptions.push(option)
	// console.log(this.checkedOptions)
	let icon:string
	let payload
	// let formValueFilter = this.activeFormList.filter(e => e.label == this.formLabel);
	// if (formValueFilter.length == 0 && this.formLabel.length != 0) {
	this.groupList.forEach(tGroup => {
		if (tGroup.name == group) {
			this.tempGroup = tGroup.features;
				icon = tGroup.icon
	
				//Creates a temporary group with a copy of the current groups info
				let tempGroup = [{
					name: tGroup.name,
					color: tGroup.color,
					icon: tGroup.icon
				}]
				
				//And adds the temp group to a payload along with the necessary style infromation
				payload = {
					group: tempGroup,
					style: {
						faIcon: icon,
						color: '#00C8FF'
					},
					tag:[]
				}
				// console.log(payload)
			
		}
		});


		// console.log(this.tempGroup)
		for (let feat of this.tempGroup) {

			if(feat.properties.tag != undefined || feat.properties.tag != []){
				// feat.properties.tag.forEach(tag => {
				//   this.newTag.push(tag)
				// });
				// console.log(feat.properties)
				// console.log(this.activeGroup)
				feat.properties.group.forEach(group => {
					if(group.name != this.activeGroup){
						let tempGroup = {
							name: group.name,
							color: group.color,
							icon: group.icon
						}
					payload.group.push(tempGroup)}
				});
			}
			  

			  // code from here is a mess
			  if(feat.properties.tag != undefined){
				this.tempData.forEach(tag => {
					if(tag.feature === id && tag.groupName === group){
						tag.extra.push(option)
					}
				  payload.tag.push(tag)
				});
			}

			// console.log(payload)
			// console.log(typeof(payload.tag))
			this.geoDataService.updateFeatureProperty(this.selectedProject.id, Number(feat.id), payload)
			// Clear out the tag section
			payload.tag = []
	}
}

deleteCheckedOpt(opt:object, id:number, group: string, label: string): void{
	const index = this.checkedOptions.findIndex(item => item.label === opt['label'] && item.id === id && item.group === group && item.title === label)
	this.checkedOptions.splice(index,1)
	// console.log(this.checkedOptions)

	let icon:string
	let payload
	// let formValueFilter = this.activeFormList.filter(e => e.label == this.formLabel);
	// if (formValueFilter.length == 0 && this.formLabel.length != 0) {
	this.groupList.forEach(tGroup => {
		if (tGroup.name == group) {
			this.tempGroup = tGroup.features;
				icon = tGroup.icon
	
				//Creates a temporary group with a copy of the current groups info
				let tempGroup = [{
					name: tGroup.name,
					color: tGroup.color,
					icon: tGroup.icon
				}]
				
				//And adds the temp group to a payload along with the necessary style infromation
				payload = {
					group: tempGroup,
					style: {
						faIcon: icon,
						color: '#00C8FF'
					},
					tag:[]
				}
				// console.log(payload)
			
		}
		});


		// console.log(this.tempGroup)
		for (let feat of this.tempGroup) {

			if(feat.properties.tag != undefined || feat.properties.tag != []){
				// feat.properties.tag.forEach(tag => {
				//   this.newTag.push(tag)
				// });
				// console.log(feat.properties)
				// console.log(this.activeGroup)
				feat.properties.group.forEach(group => {
					if(group.name != this.activeGroup){
						let tempGroup = {
							name: group.name,
							color: group.color,
							icon: group.icon
						}
					payload.group.push(tempGroup)}
				});
			}
			  

			  // code from here is a mess
			  if(feat.properties.tag != undefined){
				this.tempData.forEach(tag => {
					if(tag.feature === id && tag.groupName === group){
						const index = tag.extra.findIndex(item => item.label === opt['label'] && item.id === id && item.group === group && item.title === label)
						tag.extra.splice(index,1)
					}
				  payload.tag.push(tag)
				});
			}

			// console.log(payload)
			// console.log(typeof(payload.tag))
			this.geoDataService.updateFeatureProperty(this.selectedProject.id, Number(feat.id), payload)
			// Clear out the tag section
			payload.tag = []
	}
}

newOpt: object[] = [];
getCheckedOpt(): any[]{
	this.newOpt = []
	for (let feat of this.featureList){
		//   console.log(typeof(feat.properties.tag))
		  if(feat.properties.tag != undefined){
			  feat.properties.tag.forEach(tag => {
				//   console.log(tag)
				this.newOpt.push(tag.extra)
			  });
		  }
	  }
	//   console.log(this.newOpt)
	return this.newOpt;
}
// renameTagOpt(gName:string, opt:object, tag: tags): void {
// 	const index = this.tagData.findIndex(item => item.groupName === gName  && item.label === tag.label);
// 	if(index >-1) {
// 		const ind = this.tagData[index].options.findIndex(item => item === opt)
// 		if (ind > -1){
// 			console.log(opt)
// 			console.log(this.tagData[index].options[ind]);
// 		}
// 	}
// }

radioOptions = []
//Functions for radio buttons componentId=0 is for the radio component, componentId=1 is for color
updateSelectedRadio(selection:string, componentId: number, feature: number, group: string, label: string){ 

	let icon:string
	let payload
	// let formValueFilter = this.activeFormList.filter(e => e.label == this.formLabel);
	// if (formValueFilter.length == 0 && this.formLabel.length != 0) {
	this.groupList.forEach(tGroup => {
		// console.log(tGroup)
		// console.log(group)
		if (tGroup.name == group) {
			this.tempGroup = tGroup.features;
				icon = tGroup.icon
	
				//Creates a temporary group with a copy of the current groups info
				let tempGroup = [{
					name: tGroup.name,
					color: tGroup.color,
					icon: tGroup.icon
				}]
				
				//And adds the temp group to a payload along with the necessary style infromation
				payload = {
					group: tempGroup,
					style: {
						faIcon: icon,
						color: '#00C8FF'
					},
					tag:[]
				}
				// console.log(payload)
			
		}
		});


		// console.log(this.tempGroup)
		for (let feat of this.tempGroup) {

			if(feat.properties.tag != undefined || feat.properties.tag != []){
				// feat.properties.tag.forEach(tag => {
				//   this.newTag.push(tag)
				// });
				// console.log(feat.properties)
				// console.log(this.activeGroup)
				feat.properties.group.forEach(group => {
					if(group.name != this.activeGroup){
						let tempGroup = {
							name: group.name,
							color: group.color,
							icon: group.icon
						}
					payload.group.push(tempGroup)}
				});
			}
			  

			  // code from here is a mess
			  if(feat.properties.tag != undefined){
				this.tagData.forEach(tag => {
					if(tag.feature === feature && tag.groupName === group){
						const index = tag.extra.findIndex(item => item['id'] === feature && item['compId'] === componentId && item['groupName'] === group && item['label'] === label);
						// const index = tag.extra.findIndex(item => item.label === opt['label'] && item.id === id && item.group === group)

						if(index > -1){
							tag.extra[index]['option'] = selection
							// console.log(tag.extra)
						}
						else{
							let rOption = {option: selection, id: feature, compId: componentId, groupName: group, label: label}
							// console.log(rOption)
							tag.extra.push(rOption)
						}
					}
				  payload.tag.push(tag)
				});
			}

			// console.log(typeof(payload.tag))
			this.geoDataService.updateFeatureProperty(this.selectedProject.id, Number(feat.id), payload)
			// Clear out the tag section
			payload.tag = []
	}

	// if (index > -1) {
	// 	// console.log("IT WORKED")
	// 	this.radioOptions[index]['option'] = selection;
	// 	// this.tagData[index].options = tag.options;
	// }
	// else {
	// 	let rOption = {option: selection, id: feature, compId: componentId} 
	// 	this.radioOptions.push(rOption);
	// 	// console.log("Tag data:")
	// 	// console.log(this.tagData)
	// }
	// this.chosenTag[componentId] = {option: selection, id:id}; 
}

getSelectedRadio(): any[] { 
	this.newOpt = []
	for (let feat of this.featureList){
		//   console.log(typeof(feat.properties.tag))
		  if(feat.properties.tag != undefined){
			  feat.properties.tag.forEach(tag => {
				//   console.log(tag)
				this.newOpt.push(tag.extra)
			  });
		  }
	  }
	//   console.log(this.newOpt)
	return this.newOpt;
 }

//Notes tag functions
updateNotes(change, componentID: number, feature: number, group:string, label:string){
	// const index = this.radioOptions.findIndex(item => item['id'] === feature);
	let icon:string
	let payload
	// let formValueFilter = this.activeFormList.filter(e => e.label == this.formLabel);
	// if (formValueFilter.length == 0 && this.formLabel.length != 0) {
	this.groupList.forEach(tGroup => {
		// console.log(tGroup)
		// console.log(group)
		if (tGroup.name == group) {
			this.tempGroup = tGroup.features;
				icon = tGroup.icon
	
				//Creates a temporary group with a copy of the current groups info
				let tempGroup = [{
					name: tGroup.name,
					color: tGroup.color,
					icon: tGroup.icon
				}]
				
				//And adds the temp group to a payload along with the necessary style infromation
				payload = {
					group: tempGroup,
					style: {
						faIcon: icon,
						color: '#00C8FF'
					},
					tag:[]
				}
				// console.log(payload)
			
		}
		});


		// console.log(this.tempGroup)
		for (let feat of this.tempGroup) {

			if(feat.properties.tag != undefined || feat.properties.tag != []){
				// feat.properties.tag.forEach(tag => {
				//   this.newTag.push(tag)
				// });
				// console.log(feat.properties)
				// console.log(this.activeGroup)
				feat.properties.group.forEach(group => {
					if(group.name != this.activeGroup){
						let tempGroup = {
							name: group.name,
							color: group.color,
							icon: group.icon
						}
					payload.group.push(tempGroup)}
				});
			}
			  

			  // code from here is a mess
			  if(feat.properties.tag != undefined){
				this.tagData.forEach(tag => {
					if(tag.feature === feature && tag.groupName === group){
						const index = tag.extra.findIndex(item => item['id'] === feature && item['compID'] === componentID && item['groupName'] === group  && item['label'] === label);
						// const index = tag.extra.findIndex(item => item.label === opt['label'] && item.id === id && item.group === group)

						if(index > -1){
							// console.log(tag.extra)
							// console.log(tag.extra[index])
							tag.extra[index]['option'] = change
						}
						else{
							let rOption = {option: change, id: feature, groupName: group, compID: componentID, label:label} 
							// console.log(rOption)
							tag.extra.push(rOption);
						}
					}
				  payload.tag.push(tag)
				});
			}

			// console.log(typeof(payload.tag))
			this.geoDataService.updateFeatureProperty(this.selectedProject.id, Number(feat.id), payload)
			// Clear out the tag section
			payload.tag = []
		}
	// if (index > -1) {
	// 	// console.log("IT WORKED")
	// 	this.notebook[index]['option'] = change
	// }
	// else {
	// 	let rOption = {option: change, id: feature, groupName: group} 
	// 	this.notebook.push(rOption);
	// 	// console.log(this.tagData)
	// }
}

getNotes(): any[]{ return this.notebook }
}



export interface tags {
	type: string,
	groupName: string,
	label: string,
	options: Array<Group>,
	feature: string | number,
	extra: Array<Group>
}