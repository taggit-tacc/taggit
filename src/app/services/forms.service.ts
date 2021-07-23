import { Component, Injectable } from '@angular/core';
import {BehaviorSubject, Observable, ReplaySubject, Subject} from 'rxjs';
import {Group} from '../models/models';
import { map, first } from 'rxjs/operators';
import { GroupsService } from './groups.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';

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

  private chosenTag: Array<string> = ["","",""]; //chosen option of both Radio Buttons and Color tags. Radio info is stored at [0], Color at [1]
  private notebook: string; //Var for storing note tags

  // THIS TODO
  // private _forms: BehaviorSubject<Group> = new BehaviorSubject<Group>({type: 'Group', formList: [], groupName: []});
  // public forms: Observable<Group> = this._forms.asObservable();


  constructor(private groupsService: GroupsService) {}

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

  userTag: tags = {type: "text", groupName: "car", label:"Title", options: []};
  tagData = []
  checkedOptions = []

  saveTag(gName: string, tag: tags, tLabel: string): void{
	const index = this.tagData.findIndex(item => item.groupName === gName  && item.label === tLabel);

	if (index > -1) {
		// console.log("IT WORKED")
		this.tagData[index].label = tag.label;
		// this.tagData[index].options = tag.options;
	}
	else {
		tag.groupName = gName;
		this.tagData.push(tag);
		// console.log("Tag data:")
		// console.log(this.tagData)
	}
}
getTags(): tags[]{
	return this.tagData;
}

deleteTag(gName: string, tLabel: string): void{
	const index = this.tagData.findIndex(item => item.groupName === gName && item.label === tLabel);
    if (index > -1) {
      // delete this.exampleNote[index];
      this.tagData.splice(index, 1);
    }
}

deleteOpt(gName:string, opt:object, tag: tags): void {
	const index = this.tagData.findIndex(item => item.groupName === gName && item.label === tag.label);
	if (index > -1) {
		const ind = this.tagData[index].options.findIndex(item => item === opt)
		if (ind > -1){
			this.tagData[index].options.splice(ind,1);
		}
	}

}

addCheckedOpt(opt:object): void {
	this.checkedOptions.push(opt)
	console.log(this.checkedOptions)
}

deleteCheckedOpt(opt:object): void{
	const index = this.checkedOptions.findIndex(item => item === opt)
	this.checkedOptions.splice(index,1)
	console.log(this.checkedOptions)
}

getCheckedOpt(): object[]{
	return this.checkedOptions;
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

//Functions for radio buttons componentId=0 is for the radio component, componentId=1 is for color
updateSelectedRadio(selection:string, componentId: number){ this.chosenTag[componentId] = selection; }

getSelectedRadio(componentId: number):string { return this.chosenTag[componentId]; }

//Notes tag functions
updateNotes(change){this.notebook = change}

getNotes(){ return this.notebook }
}



export interface tags {
	type: string,
	groupName: string,
	label: string,
	options: Array<Group>
}