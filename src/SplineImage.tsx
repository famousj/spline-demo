import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';

import TensionSelector from './TensionSelector';
import SplinePoint from './SplinePoint';
import * as splinemath from './splinemath';

const SplineImage: React.FC = () => {
  const [points, setPoints] = useState<SplinePoint[]>([]);
  const [tension, setTension] = useState<number>(0.5);
  const [showIndices, setShowIndices] = useState<boolean>(true);
  const [showIntersections, setShowIntersections] = useState<boolean>(true);
  const [useUltrasoundImage, setUseUltrasoundImage] = useState<boolean>(true);

  const svgRef = useRef<SVGSVGElement>(null);

  const ultrasoundImageUrl = 'https://www.eu-focus.europeanurology.com/cms/10.1016/j.euf.2015.06.003/asset/c0a002b8-7205-4248-b3bd-342bfb5a4161/main.assets/gr1.jpg';
  const plainImageUrl = `${process.env.PUBLIC_URL}/imgs/british_racing_green.jpg`;
  const pointRadius = 10;

  const pointColor = "yellow";
  const pointOutlineColor = "black";

  function getClickedPoint(x: number, y: number): SplinePoint | undefined {
    return points.find(p => Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2)) <= pointRadius);
  }

  function clearPoints() {
    setPoints([]);
  }

  function removePoint(point: SplinePoint) {
    setPoints(prev =>  {
      return prev
        .filter(p => p != point)
        .map((point, index) => ({...point, index}))
    });
  }

  function addPoint(point: SplinePoint) {
    setPoints(prev => [...prev, point]);
  }

  function fixIntersections() {
    const updatedPoints = splinemath.untangleSpline(points);

    setPoints(updatedPoints);
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
      svg.selectAll('text').remove();
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
      
      const intersections = splinemath.findSelfIntersections(points);

      if (showIntersections && intersections.length > 0) {
        svg.selectAll('.intersection-point')
          .data(intersections)
          .enter()
          .append('circle')
          .attr('class', 'intersection-point')
          .attr('cx', d => d.point.x)
          .attr('cy', d => d.point.y)
          .attr('r', 10)
          .attr('fill', 'magenta');
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

      if (showIndices) {
        pointGroup
          .append('text')
          .attr('x', d => d.x)
          .attr('y', d => d.y + 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', 'black')
          .text(d => d.index.toString());
      }

  }, [points, tension, showIndices, showIntersections]);

  return (
    <div className="w-full max-w-[50vw] mx-auto p-4">
      <div className="relative">
        <img 
          src={useUltrasoundImage ? ultrasoundImageUrl : plainImageUrl }
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
      <div className="flex flex-col space-y-2 mt-2">
        <TensionSelector 
          tension={tension} 
          onTensionChange={setTension}
        />
        <label className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            checked={useUltrasoundImage}
            onChange={() => setUseUltrasoundImage(!useUltrasoundImage)}
            className="form-checkbox"
          />
          <span>Use Ultrasound Image Background </span>
        </label>
        <label className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            checked={showIndices}
            onChange={() => setShowIndices(!showIndices)}
            className="form-checkbox"
          />
          <span>Show Point Labels</span>
        </label>
        <label className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            checked={showIntersections}
            onChange={() => setShowIntersections(!showIntersections)}
            className="form-checkbox"
          />
          <span>Show Intersections</span>
        </label>
         <button 
          onClick={fixIntersections}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Fix Intersections
        </button>
        <button 
          onClick={clearPoints}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Clear Points
        </button>
      </div>
    </div>
  );
};

export default SplineImage;
