import React, { useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

interface SplinePoint {
  x: number;
  y: number;
}

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

function hasSplineSelfIntersection(points: SplinePoint[]): boolean {
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

const SplineDemo: React.FC = () => {
  const [points, setPoints] = useState<SplinePoint[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const imageUrl = 'https://www.eu-focus.europeanurology.com/cms/10.1016/j.euf.2015.06.003/asset/c0a002b8-7205-4248-b3bd-342bfb5a4161/main.assets/gr1.jpg';

  const pointRadius = 10;
  const tension = 0.5;

  // Memoized cardinal spline generator
  const splinePath = useMemo(() => {
    if (points.length < 2) return null;

    const lineGenerator = d3.line()
      .curve(d3.curveCardinalClosed.tension(tension))
      .x(d => d[0])
      .y(d => d[1]);

    return lineGenerator(points.map(p => [p.x, p.y]) as any);
  }, [points]);

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    // Ensure svg ref exists
    if (!svgRef.current) return;

    // Get the coordinates of the click relative to the image
    const [clickX, clickY] = d3.pointer(event);
    
    // Check if click is within any existing point's radius
    const clickedPointIndex = points.findIndex(point => {
      const distance = Math.sqrt(
        Math.pow(point.x - clickX, 2) + Math.pow(point.y - clickY, 2)
      );
      return distance <= pointRadius;
    });

    if (clickedPointIndex !== -1) {
      // Remove the point if clicked within its radius
      setPoints(prevPoints => prevPoints.filter((_, i) => i !== clickedPointIndex));
    } else {
      // Add a new point if no point was clicked
      setPoints(prevPoints => [...prevPoints, { x: clickX, y: clickY }]);
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl mb-4">Click to Add/Remove Points</h1>
      <div className="relative">
        <svg 
          ref={svgRef} 
          className="absolute top-0 left-0 pointer-events-none"
          style={{width: '100%', height: '100%', position: 'absolute'}}
        >
          {/* Draw the spline path */}
          {splinePath && (
            <path
              d={splinePath}
              fill="none"
              stroke="yellow"
              strokeWidth={3}
              opacity={0.7}
            />
          )}

          {/* Draw points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={pointRadius}
              fill="yellow"
              opacity={0.7}
            />
          ))}
        </svg>
        <img 
          src={imageUrl} 
          alt="Medical diagram" 
          onClick={handleImageClick}
          className="max-w-full cursor-pointer"
        />
      </div>
      <button 
        onClick={() => setPoints([])} 
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
      >
        Clear Points
      </button>
    </div>
  );
};

export default SplineDemo;
