import SplinePoint from './SplinePoint';
import * as d3 from 'd3';

export interface ImageProps {
  imageUrl: string;
  tension: number;
  showIndices: boolean;
  showIntersections: boolean;
};

export async function exportToFile(image: HTMLImageElement, svg: SVGSVGElement) {
  try {
    const svgClone = svg.cloneNode(true) as SVGSVGElement;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Match displayed image size
    canvas.width = image.offsetWidth;
    canvas.height = image.offsetHeight;

    // Draw base image
    ctx?.drawImage(
      image, 
      0, 
      0, 
      canvas.width, 
      canvas.height
    );

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    const svgUrl = URL.createObjectURL(svgBlob);
      
    const svgImage = new Image();
    svgImage.onload = () => {
      ctx?.drawImage(svgImage, 0, 0, canvas.width, canvas.height);
      
      // Create downloadable link for image
      const exportedImage = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = exportedImage;
      link.download = 'spline-image.png';
      link.click();

      URL.revokeObjectURL(svgUrl);
    };
    svgImage.src = svgUrl;
  } catch (error) {
    console.error('Export failed', error);
  }
};

