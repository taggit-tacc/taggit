import { Injectable } from '@angular/core';
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
	  })).subscribe(current => this._forms.next(current));


	this.changeGroupForm(groupName);
  }

  updateFormItem() {
	let group: any = {};

	this._activeFormList.value.forEach(e =>
	  group[e.label] = e.required ? new FormControl(e.value || '', Validators.required)
								  : new FormControl(e.value || '')
	);

	this._formGroup.next(new FormGroup(group));
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
	  }))).subscribe(current => {this._forms.next(current)});

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

}
