import React, { useState, useEffect } from "react";
import type { Detection } from "@shared/types";

interface ToolDetectionProps {
  toolPositions: Detection[];
  isEditMode?: boolean;
  onToolUpdated?: (index: number, updates: Partial<Detection>) => void;
  onCanvasClick?: (x: number, y: number) => void;
  onDragStateChange?: (isDragging: boolean) => void;
  containerClassName?: string;
  selectedToolId?: number | null;
  onSelectTool?: (index: number | null) => void;
}

export default function ToolDetection({
  toolPositions,
  isEditMode = false,
  onToolUpdated,
  onCanvasClick,
  onDragStateChange,
  containerClassName,
  selectedToolId = null,
  onSelectTool
}: ToolDetectionProps) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [resizeDirection, setResizeDirection] = useState<'se' | 'sw' | 'ne' | 'nw' | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (onDragStateChange) {
      onDragStateChange(isDragging || isResizing);
    }
  }, [isDragging, isResizing, onDragStateChange]);

  useEffect(() => {
    setIsDragging(false);
    setIsResizing(false);
    setActiveIndex(null);
    setResizeDirection(null);
  }, [isEditMode]);

  const getMouseCoords = (e: React.MouseEvent) => {
    const container = e.currentTarget.closest('.relative') as HTMLElement;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    };
  };

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    if (!isEditMode) return;
    e.stopPropagation();

    if (onSelectTool) onSelectTool(index);

    const { x: mouseX, y: mouseY } = getMouseCoords(e);
    const tool = toolPositions[index];

    setDragOffset({
      x: mouseX - tool.x,
      y: mouseY - tool.y
    });

    setIsDragging(true);
    setActiveIndex(index);
  };

  const handleResizeStart = (e: React.MouseEvent, index: number, direction: 'se' | 'sw' | 'ne' | 'nw') => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.preventDefault();

    if (onSelectTool) onSelectTool(index);

    setIsResizing(true);
    setActiveIndex(index);
    setResizeDirection(direction);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    if (!isDragging && !isResizing) return;
    if (activeIndex === null) return;

    const { x: mouseX, y: mouseY } = getMouseCoords(e);

    // --- LOGIC 1: MOVING ---
    if (isDragging && onToolUpdated) {
      const newX = mouseX - dragOffset.x;
      const newY = mouseY - dragOffset.y;

      onToolUpdated(activeIndex, { x: newX, y: newY });
      return;
    }

    // --- LOGIC 2: RESIZING ---
    if (isResizing && resizeDirection && onToolUpdated) {
      const tool = toolPositions[activeIndex];
      const rightEdge = tool.x + tool.width;
      const bottomEdge = tool.y + tool.height;

      let newX = tool.x;
      let newY = tool.y;
      let newW = tool.width;
      let newH = tool.height;

      switch (resizeDirection) {
        case 'se': // Moving Bottom-Right
          newW = mouseX - tool.x;
          newH = mouseY - tool.y;
          break;
        case 'sw': // Moving Bottom-Left
          newW = rightEdge - mouseX;
          newX = mouseX;
          newH = mouseY - tool.y;
          break;
        case 'ne': // Moving Top-Right
          newW = mouseX - tool.x;
          newH = bottomEdge - mouseY;
          newY = mouseY;
          break;
        case 'nw': // Moving Top-Left
          newW = rightEdge - mouseX;
          newX = mouseX;
          newH = bottomEdge - mouseY;
          newY = mouseY;
          break;
      }

      // Clamp Min Size
      const minSize = 2;
      if (newW < minSize) {
        newW = minSize;
        if (resizeDirection === 'sw' || resizeDirection === 'nw') newX = rightEdge - minSize;
      }
      if (newH < minSize) {
        newH = minSize;
        if (resizeDirection === 'ne' || resizeDirection === 'nw') newY = bottomEdge - minSize;
      }

      // ATOMIC UPDATE: Send all changes at once to prevent state overwrites
      onToolUpdated(activeIndex, {
        x: newX,
        y: newY,
        width: newW,
        height: newH
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setActiveIndex(null);
    setResizeDirection(null);
  };

  return (
    <div
      className={containerClassName || "absolute inset-0 z-20"}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={(e) => {
        if (!isEditMode || !onCanvasClick) return;
        const target = e.target as HTMLElement;
        if (target.closest('[data-tool-shape="true"]')) return;
        const { x, y } = getMouseCoords(e);
        onCanvasClick(x, y);
      }}
    >
      <div className="absolute top-2 right-2 z-30 pointer-events-auto">
        <button
          onClick={(e) => { e.stopPropagation(); setShowOverlay(!showOverlay); }}
          className="bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm transition-colors border border-white/10"
        >
          {showOverlay ? 'Hide Overlay' : 'Show Overlay'}
        </button>
      </div>

      {showOverlay && toolPositions.map((tool, index) => {
        const isSelected = (activeIndex === index) || (selectedToolId === index);

        return (
          <div
            key={index}
            data-tool-shape="true"
            className="absolute group"
            style={{
              top: `${tool.y}%`,
              left: `${tool.x}%`,
              width: `${tool.width}%`,
              height: `${tool.height}%`,
              zIndex: isSelected ? 30 : 20,
              cursor: isEditMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
            }}
            onMouseDown={(e) => handleMouseDown(e, index)}
          >
            <div className={`w-full h-full border-2 ${isSelected ? "border-axiom-cyan bg-axiom-cyan/20 " : "border-green-400 bg-green-400/20"}`} />

            <div className={`absolute top-1 left-1 p-1 text-xs select-none ${isSelected ? 'bg-axiom-cyan text-black' : 'bg-black/50 text-white'}`}>{tool.name}</div>

            {isEditMode && isSelected && (
              <>
                <div className="bg-white rounded-full cursor-se-resize z-40 hover:scale-125 absolute -bottom-1.5 -right-1.5 w-4 h-4" onMouseDown={(e) => handleResizeStart(e, index, 'se')} />
                <div className="bg-white rounded-full cursor-sw-resize z-40 hover:scale-125 absolute -bottom-1.5 -left-1.5 w-4 h-4" onMouseDown={(e) => handleResizeStart(e, index, 'sw')} />
                <div className="bg-white rounded-full cursor-ne-resize z-40 hover:scale-125 absolute -top-1.5 -right-1.5 w-4 h-4" onMouseDown={(e) => handleResizeStart(e, index, 'ne')} />
                <div className="bg-white rounded-full cursor-nw-resize z-40 hover:scale-125 absolute -top-1.5 -left-1.5 w-4 h-4" onMouseDown={(e) => handleResizeStart(e, index, 'nw')} />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}