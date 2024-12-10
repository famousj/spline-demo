import SplinePoint from './SplinePoint';
import * as d3 from 'd3';

export interface ImageProps {
  imageUrl: string;
  tension: number;
  showIndices: boolean;
  showIntersections: boolean;
};

export function exportImage(points: SplinePoint[], props: ImageProps) {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('Could not get canvas context');
    return;
  }

  // Create an image element
  const img = new Image();
  img.crossOrigin = 'Anonymous'; // Enable CORS for external images
  
  img.onload = () => {
    // Set canvas size to match image
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the original image
    ctx.drawImage(img, 0, 0);

    // Create an SVG to draw spline and points
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', img.width.toString());
    svg.setAttribute('height', img.height.toString());

    // If points exist, create spline
    if (points.length >= 3) {
      const lineGenerator = d3.line<SplinePoint>()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveCardinalClosed.tension(props.tension));
      
      const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathElement.setAttribute('d', lineGenerator(points) || '');
      pathElement.setAttribute('fill', 'none');
      pathElement.setAttribute('stroke', 'yellow');
      pathElement.setAttribute('stroke-width', '2');
      pathElement.setAttribute('opacity', '0.7');
      
      svg.appendChild(pathElement);
    }

    // Add points
    points.forEach((point, index) => {
      // Create circle for point
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', point.x.toString());
      circle.setAttribute('cy', point.y.toString());
      circle.setAttribute('r', '10');
      circle.setAttribute('fill', 'yellow');
      circle.setAttribute('stroke', 'black');
      
      // Create text for index
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', point.x.toString());
      text.setAttribute('y', (point.y + 2).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', 'black');
      text.textContent = index.toString();
      
      svg.appendChild(circle);
      svg.appendChild(text);
    });

    // Convert SVG to image
    const svgString = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const svgImage = new Image();
    svgImage.onload = () => {
      // Draw SVG on top of original image
      ctx.drawImage(svgImage, 0, 0);

      // Convert to downloadable image
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'spline-image.png';
      link.href = dataUrl;
      link.click();

      // Clean up
      URL.revokeObjectURL(svgUrl);
    };
    svgImage.src = svgUrl;
  };

  // Load the image
  img.src = props.imageUrl;
};
