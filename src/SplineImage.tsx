import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface SplinePoint {
  x: number;
  y: number;
  index: number;
}

const SplineImage: React.FC = () => {
  const [points, setPoints] = useState<SplinePoint[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const imageUrl = 'https://www.eu-focus.europeanurology.com/cms/10.1016/j.euf.2015.06.003/asset/c0a002b8-7205-4248-b3bd-342bfb5a4161/main.assets/gr1.jpg';
  const pointRadius = 10;
  const tension = 0.5;

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
  }, [points]);

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
    </div>
  );
};

export default SplineImage;



function doLinesIntersect(
  p1: [number, number], 
  p2: [number, number], 
  p3: [number, number], 
  p4: [number, number]
): boolean {
  const CCW = (A: [number, number], B: [number, number], C: [number, number]) => {
    return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0]);
  };

  return (
    CCW(p1, p3, p4) !== CCW(p2, p3, p4) && 
    CCW(p1, p2, p3) !== CCW(p1, p2, p4)
  );
}

function hasSplineSelfIntersection(points: SplinePoint[]): boolean {Lal
  const n = points.length;
  
  // Need at least 4 points to have a self-intersection
  if (n < 4) return false;

  // Check every pair of non-adjacent line segments
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      // Skip adjacent segments and wrap around for closed spline
      if (
        i === 0 && j === n - 1 // Skip connecting segment
      ) continue;

      const p1: [number, number] = [points[i].x, points[i].y];
      const p2: [number, number] = [points[(i + 1) % n].x, points[(i + 1) % n].y];
      const p3: [number, number] = [points[j].x, points[j].y];
      const p4: [number, number] = [points[(j + 1) % n].x, points[(j + 1) % n].y];

      if (doLinesIntersect(p1, p2, p3, p4)) {
        return true;
      }
    }
  }

  return false;
}
