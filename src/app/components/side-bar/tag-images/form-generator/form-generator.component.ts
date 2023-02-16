import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { GroupForm } from 'src/app/models/models';

@Component({
  selector: 'app-form-generator',
  templateUrl: './form-generator.component.html',
  styleUrls: ['./form-generator.component.scss'],
})
export class FormGeneratorComponent implements OnInit {
  constructor() { }
  @Input() form: GroupForm;
  checked = false;
  colorArray: Array<string> = [];
  values = [];

  name = new FormControl('');

  ngOnInit() {
    this.generateColors();
  }

  // Generates a key:value list of colors ranging from green (#00FF00) to red (#FF0000) based on passed in info
  generateColors() {
    let itemCount = this.form.options.length;
    let isOdd = false;
    if (itemCount % 2 === 1) {
      // if there are an odd number of items in the collection, mark it and decriment the counter
      isOdd = true;
      itemCount--;
    }
    // Subtract 2 from item count (first entry is always green, #00FF00, last entry is always red, #FF0000
    // Then half the item count, and use it to divide 255, this gives the amount we have to increment the colors
    itemCount = (itemCount - 2) / 2;
    let incrementVal = Math.floor(255 / itemCount);
    if (incrementVal === 255) {
      incrementVal = Math.floor(incrementVal / 2);
    }
    this.colorArray.push('#00FF00');
    let baseNum = 0;
    let temp: string;
    // First loop, counts up from zero towards 255
    for (let index = 0; index < itemCount; index++) {
      baseNum = baseNum + incrementVal;
      temp = baseNum.toString(16);
      this.colorArray.push(`#${temp}FF00`);
    }
    // if there is an odd number of selections, push full yellow as a midpoint in the gradient
    if (isOdd) {
      this.colorArray.push('#FFFF00');
    }
    baseNum = 255; // Resets baseNum to 255 for the count down
    // Second loop, counts down from 255 towards zero
    for (let index = 0; index < itemCount; index++) {
      baseNum = baseNum - incrementVal;
      temp = baseNum.toString(16);
      if (temp.length != 2) {
        temp = '0' + temp;
      }
      this.colorArray.push(`#FF${temp}00`);
    }
    // Finally, pushes the color code for red onto the stack for the last entry
    this.colorArray.push('#FF0000');
  }
}
