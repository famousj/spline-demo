import React, { useState, useMemo, useRef, useEffect } from 'react';
import TensionSelector from './TensionSelector';
import * as d3 from 'd3';

interface SplinePoint {
  x: number;
  y: number;
  index: number;
}

const SplineImage: React.FC = () => {
  const [points, setPoints] = useState<SplinePoint[]>([]);
  const [tension, setTension] = useState<number>(0.5);
  //const [intersections, setIntersections] = useState<{x: number, y: number}[]>([]);

  const svgRef = useRef<SVGSVGElement>(null);

  const imageUrl = 'https://www.eu-focus.europeanurology.com/cms/10.1016/j.euf.2015.06.003/asset/c0a002b8-7205-4248-b3bd-342bfb5a4161/main.assets/gr1.jpg';
  const pointRadius = 10;

  const pointColor = "yellow";
  const pointOutlineColor = "black";

  function getClickedPoint(x: number, y: number): SplinePoint | undefined {
    return points.find(p => Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2)) <= pointRadius);
  }

  function removePoint(point: SplinePoint) {
    setPoints(prev =>  {
      return prev
        .filter(p => p != point)
        .map((circle, index) => ({...circle, index}))
    });
  }

  function addPoint(point: SplinePoint) {
    setPoints(prev => [...prev, point]);
  }

  function handleImageClick(event: React.MouseEvent<HTMLImageElement>) {
    console.log('Image clicked');

    if (!svgRef.current) { return };
   
    const svg = d3.select(svgRef.current);
    const [x, y] = d3.pointer(event);

    console.log(`image click: ${x}, ${y}`);

    const clickedPoint = getClickedPoint(x, y);

    if (clickedPoint) {
      removePoint(clickedPoint);
    } else {
      const newPoint: SplinePoint = { x, y, index: points.length };
      addPoint(newPoint);
    }
  }

  function handlePointClick(clickedPoint: SplinePoint) {
    setPoints(prevPoints => 
      prevPoints
        .filter(point => point != clickedPoint)
    );

  }

  function addSpline<T extends Selection>(svg: T) {
  }

  useEffect(() => {
    if (!svgRef.current) { return };
      const svg = d3.select(svgRef.current);
     
      svg.selectAll('g').remove();
      svg.selectAll('path').remove();
      svg.selectAll('.intersection-point').remove();

      if (points.length >= 3) {
        // Create cardinal spline
        const lineGenerator = d3.line<SplinePoint>()
          .x(d => d.x)
          .y(d => d.y)
          .curve(d3.curveCardinalClosed.tension(tension));
         
        svg.append("path")
          .datum(points)
          .attr("d", lineGenerator)
          .attr("fill", "none")
          .attr("stroke", pointColor)
          .attr("stroke-width", 2)
          .attr('opacity', 0.7);
      };
      
      const intersections = findSelfIntersections(points);

      // Render intersection points
      if (intersections.length > 0) {
        svg.selectAll('.intersection-point')
          .data(intersections)
          .enter()
          .append('circle')
          .attr('class', 'intersection-point')
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)
          .attr('r', 10)
          .attr('fill', 'green');
      }

      const pointGroup = svg.selectAll('g')
        .data(points)
        .enter()
        .append('g')
        .style('cursor', 'pointer')
        .on('click', (_, d) => handlePointClick(d));

      pointGroup
        .append('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', pointRadius)
        .attr('fill', pointColor)
        .attr('stroke', pointOutlineColor)

      pointGroup
        .append('text')
        .attr('x', d => d.x)
        .attr('y', d => d.y + 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'black')
        .text(d => d.index.toString());
  }, [points, tension]);

  return (
    <div className="w-full max-w-[50vw] mx-auto p-4">
      <div className="relative">
        <img 
          src={imageUrl}
          onClick={handleImageClick}
          className="w-full cursor-pointer"
          draggable="false"
          onDragStart={(e) => e.preventDefault()}
        />
        <svg 
          ref={svgRef} 
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
      </div>
      <div className="flex justify-between items-center">
        <TensionSelector 
          tension={tension} 
          onTensionChange={setTension}
        />
      </div>

    </div>
  );
};

export default SplineImage;

// Bentley-Ottmann Algorithm implementation
function findSelfIntersections(points: SplinePoint[]): {x: number, y: number}[] {
  console.log("Checking for intersections for " + JSON.stringify(points));

  // If fewer than 4 points, no self-intersection possible
  if (points.length < 4) return [];

  // Convert points to line segments
  const segments = points.map((point, i) => ({
    start: point,
    end: points[(i + 1) % points.length],
    id: i
  }));

  // Utility function to compute orientation
  const orientation = (p: SplinePoint, q: SplinePoint, r: SplinePoint) => {
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (val === 0) return 0;  // Collinear
    return val > 0 ? 1 : 2;  // Clockwise or Counterclockwise
  };

  // Check if line segments intersect
  const doIntersect = (seg1: any, seg2: any) => {
    const p1 = seg1.start, q1 = seg1.end;
    const p2 = seg2.start, q2 = seg2.end;

    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    // General case
    if (o1 !== o2 && o3 !== o4) return true;

    // Special Cases (collinear)
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;

    return false;
  };

  // Check if point q lies on line segment pr
  const onSegment = (p: SplinePoint, q: SplinePoint, r: SplinePoint) => {
    return (
      q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
      q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y)
    );
  };

  // Compute intersection point
  const computeIntersection = (seg1: any, seg2: any) => {
    const p1 = seg1.start, q1 = seg1.end;
    const p2 = seg2.start, q2 = seg2.end;

    const x1 = p1.x, y1 = p1.y;
    const x2 = q1.x, y2 = q1.y;
    const x3 = p2.x, y3 = p2.y;
    const x4 = q2.x, y4 = q2.y;

    const denom = ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
    if (denom === 0) return null;  // Parallel lines

    const ua = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / denom;
    const ub = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / denom;

    // Ensure intersection is within both line segments
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return {
        x: x1 + ua * (x2 - x1),
        y: y1 + ua * (y2 - y1)
      };
    }

    return null;
  };

  // Find intersections, avoiding adjacent segments
  const intersections: {x: number, y: number}[] = [];
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 2; j < segments.length; j++) {
      // Wrap around for closed spline
      if (i === 0 && j === segments.length - 1) continue;

      if (doIntersect(segments[i], segments[j])) {
        const intersect = computeIntersection(segments[i], segments[j]);
        if (intersect) intersections.push(intersect);
      }
    }
  }

  console.log(`Found intersections ${JSON.stringify(intersections)}`);

  return intersections;
}
