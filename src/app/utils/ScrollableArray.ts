import {Subject} from 'rxjs';

/**
 * Given an input array of type <T>, this class can be used for infinite scroll by
 * subscribing to the `currentSelection` Subject property, which contains only a window
 * of the full dataset. This keeps only a small number of elements in the dom which
 * is better for performance.
 */
export class ScrollableArray<T> {

  private windowSize = 200;
  private fetchSize = 100;
  private content: Array<T> = [];
  private startIdx  = 0;
  public readonly currentSelection: Subject<Array<T>> = new Subject();

  constructor(data: Array<T>) {
    this.content = data;
  }

  get length(): number {
    return this.content.length;
  }

  setContent(data: Array<T>) {
    this.content = data;
    this.startIdx = 0;

    this.currentSelection.next(this.content.slice(this.startIdx, this.windowSize));
  }

  setFetchSize(num: number) {
    this.fetchSize = num;
  }

  setWindowSize(num: number) {
    this.windowSize = num;
  }

  scrollTo(target: any) {
    const idx: number = this.content.indexOf(target);
    if (idx >= 0) {
      // this.startIdx = idx;
      this.startIdx = Math.min(this.content.length - this.fetchSize, idx);
      this.currentSelection.next(this.content.slice(this.startIdx, this.startIdx + this.windowSize));
    }
  }

  scrollUp() {
    this.startIdx = Math.max(0, this.startIdx - this.fetchSize);
    const tmp = this.content.slice(this.startIdx, this.startIdx + this.windowSize);
    this.currentSelection.next(tmp);  }

  scrollDown() {
    this.startIdx = Math.min(this.content.length - this.fetchSize, this.startIdx + this.fetchSize);
    const tmp = this.content.slice(this.startIdx, this.startIdx + this.windowSize);
    this.currentSelection.next(tmp);
  }

}
