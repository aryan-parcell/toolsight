import React from 'react';
import type { AnchorPoint } from '../types';

interface AnchorPointOverlayProps {
  anchorPoints: AnchorPoint[];
  onAnchorPointsChange: (anchorPoints: AnchorPoint[]) => void;
  isEditMode: boolean;
  onCanvasClick?: (x: number, y: number) => void;
  selectedAnchorId?: string | null;
  onSelectAnchor?: (id: string) => void;
  className?: string;
}

export default function AnchorPointOverlay({
  anchorPoints,
  onAnchorPointsChange,
  isEditMode,
  onCanvasClick,
  selectedAnchorId,
  onSelectAnchor,
  className
}: AnchorPointOverlayProps) {

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditMode || !onCanvasClick) return;
    const target = event.target as HTMLElement;
    // Prevent triggering canvas click if clicking an anchor point
    if (target.closest('[data-anchor-point="true"]')) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    onCanvasClick(x, y);
  };

  const getAnchorColors = (index: number) => {
    const colors = [
      'bg-red-500 border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.6)]',
      'bg-blue-500 border-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.6)]', 
      'bg-green-500 border-green-600 shadow-[0_0_10px_rgba(34,197,94,0.6)]',
      'bg-yellow-500 border-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.6)]'
    ];
    return colors[index] || 'bg-gray-500 border-gray-600';
  };

  return (
    <div 
      className={`absolute inset-0 ${className || 'z-30'}`}
      onClick={handleCanvasClick}
      style={{ cursor: isEditMode && anchorPoints.length < 4 ? 'crosshair' : 'default' }}
    >
      {/* Render anchor points */}
      {anchorPoints.map((anchor, index) => {
        const isSelected = selectedAnchorId === anchor.id;
        return (
            <div
                key={anchor.id}
                data-anchor-point="true"
                className={`absolute w-6 h-6 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110 ${getAnchorColors(index)} ${isSelected ? 'ring-2 ring-white scale-110' : ''}`}
                style={{
                    left: `${anchor.x}%`,
                    top: `${anchor.y}%`,
                    pointerEvents: 'auto' // Always interactable when visible
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectAnchor) onSelectAnchor(anchor.id);
                }}
            >
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white pointer-events-none">
                    {index + 1}
                </div>
                <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white bg-black/80 px-2 py-0.5 rounded whitespace-nowrap pointer-events-none">
                    {anchor.label}
                </div>
            </div>
        );
      })}
    </div>
  );
}
