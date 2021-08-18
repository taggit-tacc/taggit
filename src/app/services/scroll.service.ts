import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {

  constructor() { }

  public scrollRestored:boolean = true //if true, the scroll was restored to the proper place
  public scrollPosition:number = 0

  setScrollRestored(change:boolean) { this.scrollRestored = change; }

  setScrollPosition(newPos:number) { this.scrollPosition = document.documentElement.scrollTop; }

  scroll() {
    //Attempts to scroll to the specified location
		document.documentElement.scroll({top: this.scrollPosition})
		//if it reaches there, marks the check as complete
		if(document.documentElement.scrollTop == this.scrollPosition){
			this.scrollRestored = false
		}
  }
}
