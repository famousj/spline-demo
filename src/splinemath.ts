import Point from './Point';
import SplinePoint from './SplinePoint';

export interface Intersection {
  segment1: Segment,
  segment2: Segment,
  point: Point,
}

export interface Segment {
  start: SplinePoint,
  end: SplinePoint,
}

enum Orientation {
  Collinear = 0,
  CW = 1,
  CCW = 2,
}

function getOrientation(p: Point, q: Point, r: Point): Orientation {
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (val === 0) return Orientation.Collinear;
    return val > 0 ? Orientation.CW : Orientation.CCW;
}

function doIntersect(seg1: Segment, seg2: Segment): boolean {
  const p1 = seg1.start, q1 = seg1.end;
  const p2 = seg2.start, q2 = seg2.end;

  const o1 = getOrientation(p1, q1, p2);
  const o2 = getOrientation(p1, q1, q2);
  const o3 = getOrientation(p2, q2, p1);
  const o4 = getOrientation(p2, q2, q1);

  // General case
  if (o1 !== o2 && o3 !== o4) return true;

  // Special Cases (collinear)
  if (o1 === Orientation.Collinear && onSegment(p1, p2, q1)) return true;
  if (o2 === Orientation.Collinear && onSegment(p1, q2, q1)) return true;
  if (o3 === Orientation.Collinear && onSegment(p2, p1, q2)) return true;
  if (o4 === Orientation.Collinear && onSegment(p2, q1, q2)) return true;

  return false;
}

// Check if point q lies on line segment pr
function onSegment(p: Point, q: Point, r: Point) { 
  return (
    q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y)
  );
}

function computeIntersectionPoint(seg1: any, seg2: any): Point | undefined {
  const p1 = seg1.start, q1 = seg1.end;
  const p2 = seg2.start, q2 = seg2.end;
 
  const x1 = p1.x, y1 = p1.y;
  const x2 = q1.x, y2 = q1.y;
  const x3 = p2.x, y3 = p2.y;
  const x4 = q2.x, y4 = q2.y;
 
  const denom = ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
  if (denom === 0) return undefined;  // Parallel lines
 
  const ua = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / denom;
  const ub = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / denom;
 
  // Ensure intersection is within both line segments
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1),
    };
  }

  return undefined;
};

// Bentley-Ottmann Algorithm implementation
export function findSelfIntersections(points: SplinePoint[]): Intersection[] {
  console.log("Checking for intersections for " + JSON.stringify(points));

  // If fewer than 4 points, no self-intersection possible
  if (points.length < 4) return [];

  // Convert points to line segments
  const segments: Segment[] = points.map((point, i) => ({
    start: point,
    end: points[(i + 1) % points.length],
    id: i
  }));

  // Find intersections, avoiding adjacent segments
  const intersections: Intersection[] = [];
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 2; j < segments.length; j++) {
      // Wrap around for closed spline
      if (i === 0 && j === segments.length - 1) continue;

      if (doIntersect(segments[i], segments[j])) {
        const intersectionPoint = computeIntersectionPoint(segments[i], segments[j]);
        if (intersectionPoint) {
          const intersection: Intersection = {
            segment1: segments[i],
            segment2: segments[j],
            point: intersectionPoint,
          };

          intersections.push(intersection);
        }
      }
    }
  }

  console.log(`Found intersections ${JSON.stringify(intersections)}`);

  return intersections;
}
