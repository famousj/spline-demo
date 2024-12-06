import SplinePoint from './SplinePoint';

export default class Segment {
  constructor(public p: SplinePoint, public q: SplinePoint) {}

  startIndex(): number {
    if (this.p.index === 0) {
      return this.q.index;
    } else if (this.q.index === 0) {
      return this.p.index;
    } else {
      return Math.min(this.p.index, this.q.index);
    }
  }

  endIndex(): number {
    if (this.p.index == 0 || this.q.index == 0) { return 0; }
    return Math.max(this.p.index, this.q.index);
  }
}
