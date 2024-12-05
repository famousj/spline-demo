import React from 'react';

// Tension Selector Component
export interface TensionSelectorProps {
  tension: number;
  onTensionChange: (tension: number) => void;
}

const TensionSelector: React.FC<TensionSelectorProps> = ({ tension, onTensionChange }) => {
  return (
    <div className="mb-4 flex items-center">
      <label className="mr-2">Spline Tension:</label>
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.01" 
        value={tension}
        onChange={(e) => onTensionChange(parseFloat(e.target.value))}
        className="w-64 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
};

export default TensionSelector;
