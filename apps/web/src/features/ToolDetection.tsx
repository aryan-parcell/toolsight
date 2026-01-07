import React, { useState, useEffect } from "react";
import type { ToolPosition } from "../types";

interface ToolDetectionProps {
  toolPositions: ToolPosition[];
  isEditMode?: boolean;
  onToolMoved?: (index: number, newX: number, newY: number) => void;
  onToolResized?: (index: number, newWidth: number, newHeight: number) => void;
  onToolRotated?: (index: number, newAngle: number) => void;
  onCircleResized?: (index: number, newRadius: number) => void;
  onPolygonVertexMoved?: (toolIndex: number, vertexIndex: number, newX: number, newY: number) => void;
  onPolygonVertexAdded?: (toolIndex: number, afterVertexIndex: number, newX: number, newY: number) => void;
  onCanvasClick?: (x: number, y: number) => void;
  onDragStateChange?: (isDragging: boolean) => void;
  containerClassName?: string;
  drawingPoints?: {x: number, y: number}[];
  isDrawingMode?: boolean;
  selectedToolId?: number | null;
  onSelectTool?: (index: number | null) => void;
}

export default function ToolDetection({ 
  toolPositions, 
  isEditMode = false,
  onToolMoved,
  onToolResized,
  onToolRotated,
  onCircleResized,
  onPolygonVertexMoved,
  onPolygonVertexAdded,
  onCanvasClick,
  onDragStateChange,
  containerClassName,
  drawingPoints = [],
  isDrawingMode = false,
  selectedToolId = null,
  onSelectTool
}: ToolDetectionProps) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'se' | 'sw' | 'ne' | 'nw' | 'circle' | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [rotateIndex, setRotateIndex] = useState<number | null>(null);
  const [isVertexDragging, setIsVertexDragging] = useState(false);
  const [vertexDragInfo, setVertexDragInfo] = useState<{toolIndex: number, vertexIndex: number} | null>(null);

  useEffect(() => {
    if (onDragStateChange) {
      onDragStateChange(isDragging || isVertexDragging);
    }
  }, [isDragging, isVertexDragging, onDragStateChange]);

  useEffect(() => {
    return () => {
      setIsDragging(false);
      setDragIndex(null);
      setIsResizing(false);
      setResizeDirection(null);
      setIsRotating(false);
      setRotateIndex(null);
      setIsVertexDragging(false);
      setVertexDragInfo(null);
    };
  }, [isEditMode]);

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    if (!isEditMode) return;
    e.stopPropagation();
    
    if (onSelectTool) {
        onSelectTool(index);
    }

    setIsDragging(true);
    setDragIndex(index);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const container = e.currentTarget.parentElement;
    if (!container || !isEditMode || (dragIndex === null && rotateIndex === null)) return;

    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

    if (isDragging && onToolMoved && dragIndex !== null) {
      const tool = toolPositions[dragIndex];
      const newX = mouseX - (tool.width / 2);
      const newY = mouseY - (tool.height / 2);
      onToolMoved(dragIndex, newX, newY);
      return;
    }

    if (isResizing && resizeDirection && dragIndex !== null) {
      const currentTool = toolPositions[dragIndex];

      if (resizeDirection === 'circle' && onCircleResized) {
        const centerX = currentTool.cx || 50;
        const centerY = currentTool.cy || 50;
        const newRadius = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));
        onCircleResized(dragIndex, Math.max(2, newRadius));
        return;
      }

      if (onToolResized) {
        let newWidth = currentTool.width;
        let newHeight = currentTool.height;

        switch (resizeDirection) {
          case 'se':
            newWidth = Math.max(2, mouseX - currentTool.x);
            newHeight = Math.max(2, mouseY - currentTool.y);
            break;
          case 'sw':
            newWidth = Math.max(2, (currentTool.x + currentTool.width) - mouseX);
            newHeight = Math.max(2, mouseY - currentTool.y);
            break;
          case 'ne':
            newWidth = Math.max(2, mouseX - currentTool.x);
            newHeight = Math.max(2, (currentTool.y + currentTool.height) - mouseY);
            break;
          case 'nw':
            newWidth = Math.max(2, (currentTool.x + currentTool.width) - mouseX);
            newHeight = Math.max(2, (currentTool.y + currentTool.height) - mouseY);
            break;
        }

        onToolResized(dragIndex, Math.max(3, newWidth), Math.max(3, newHeight));
        return;
      }
    }

    if (isRotating && onToolRotated && rotateIndex !== null) {
      const currentTool = toolPositions[rotateIndex];
      const toolCenterX = currentTool.x + currentTool.width / 2;
      const toolCenterY = currentTool.y + currentTool.height / 2;
      const deltaX = mouseX - toolCenterX;
      const deltaY = mouseY - toolCenterY;
      const angle = (Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90);
      onToolRotated(rotateIndex, angle);
      return;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragIndex(null);
    setIsResizing(false);
    setResizeDirection(null);
    setIsRotating(false);
    setRotateIndex(null);
  };

  const handleResizeStart = (e: React.MouseEvent, index: number, direction: 'se' | 'sw' | 'ne' | 'nw' | 'circle') => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setDragIndex(index);
    setResizeDirection(direction);
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

        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        onCanvasClick(x, y);
      }}
    >
      <div className="absolute top-2 right-2 z-30">
        <button 
            onClick={(e) => { e.stopPropagation(); setShowOverlay(!showOverlay); }}
            className="bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm transition-colors"
        >
          {showOverlay ? 'Hide Overlay' : 'Show Overlay'}
        </button>
      </div>

      {showOverlay && toolPositions.map((tool, index) => {
        const shapeType = tool.shapeType || 'rectangle';
        const isSelected = (isDragging && dragIndex === index) || (selectedToolId === index);

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
              transform: `rotate(${tool.angle || 0}deg)`,
              transformOrigin: 'center',
              zIndex: isSelected ? 25 : 20,
              transition: isDragging && dragIndex === index ? 'none' : 'all 0.1s ease',
              cursor: isEditMode ? 'move' : 'default',
            }}
            onMouseDown={(e) => handleMouseDown(e, index)}
          >
            {/* Shape rendering */}
            <div
              className={`w-full h-full border-2 transition-colors ${
                isSelected 
                    ? "border-axiom-cyan bg-axiom-cyan/20" 
                    : tool.status === "missing" 
                        ? "border-red-500 bg-red-500/20 hover:bg-red-500/30" 
                        : "border-green-500 bg-green-500/10 hover:bg-green-500/20"
              }`}
              style={{
                borderRadius: shapeType === 'circle' ? '50%' : '2px',
                borderStyle: shapeType === 'polygon' ? 'none' : 'solid',
              }}
            >
              {shapeType === 'polygon' && tool.points && tool.points.length > 0 && (
                (() => {
                  // Calculate the actual bounds of the polygon points
                  const minX = Math.min(...tool.points.map(p => p.x));
                  const maxX = Math.max(...tool.points.map(p => p.x));
                  const minY = Math.min(...tool.points.map(p => p.y));
                  const maxY = Math.max(...tool.points.map(p => p.y));
                  const polygonWidth = maxX - minX;
                  const polygonHeight = maxY - minY;
                  
                  return (
                    <svg 
                      width="100%" 
                      height="100%" 
                      viewBox={`${minX} ${minY} ${polygonWidth} ${polygonHeight}`} 
                      preserveAspectRatio="xMidYMid meet"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    >
                      <polygon
                        points={tool.points.map(p => `${p.x},${p.y}`).join(' ')}
                        stroke={isSelected ? "#00E5FF" : (tool.status === "missing" ? "#ef4444" : "#22c55e")}
                        strokeWidth="1"
                        fill={isSelected ? "rgba(0, 229, 255, 0.2)" : (tool.status === "missing" ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.1)")}
                        style={{ vectorEffect: 'non-scaling-stroke' }}
                      />
                      {/* Add interactive vertex handles in edit mode */}
                      {isEditMode && isSelected && tool.points.map((point, idx) => (
                        <g key={`vertex-${idx}`}>
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="1.5"
                            fill="#00E5FF"
                            stroke="white"
                            strokeWidth="1"
                            style={{ 
                              vectorEffect: 'non-scaling-stroke',
                              cursor: 'move'
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsVertexDragging(true);
                              setVertexDragInfo({toolIndex: index, vertexIndex: idx});
                              
                              const containerRect = e.currentTarget.closest('.relative')?.getBoundingClientRect();
                              if (!containerRect) return;
                              
                              const handleMouseMove = (moveE: MouseEvent) => {
                                moveE.preventDefault();
                                const rect = containerRect;
                                const mouseX = ((moveE.clientX - rect.left) / rect.width) * 100;
                                const mouseY = ((moveE.clientY - rect.top) / rect.height) * 100;
                                
                                if (onPolygonVertexMoved) {
                                  onPolygonVertexMoved(index, idx, mouseX, mouseY);
                                }
                              };
                              
                              const handleMouseUp = (upE: MouseEvent) => {
                                upE.preventDefault();
                                upE.stopPropagation();
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                                setIsVertexDragging(false);
                                setVertexDragInfo(null);
                              };
                              
                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          />
                        </g>
                      ))}
                    </svg>
                  );
                })()
              )}
            </div>

            {/* Label */}
            <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs px-1.5 py-0.5 rounded font-medium shadow-sm whitespace-nowrap ${isSelected ? 'bg-axiom-cyan text-black' : 'bg-black/80 text-white hidden group-hover:block'}`}>
              {`${index + 1}: ${tool.name}`}
            </div>

            {/* Handles */}
            {isEditMode && isSelected && (
              <>
                {shapeType !== 'circle' && (
                  <div
                    className="absolute -top-4 left-1/2 w-3 h-3 bg-axiom-cyan border border-white rounded-full cursor-alias z-30"
                    style={{ transform: 'translate(-50%, -50%)' }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsRotating(true);
                      setRotateIndex(index);
                    }}
                  />
                )}
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white border border-gray-500 rounded-full cursor-se-resize z-30" onMouseDown={(e) => handleResizeStart(e, index, 'se')} />
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border border-gray-500 rounded-full cursor-sw-resize z-30" onMouseDown={(e) => handleResizeStart(e, index, 'sw')} />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border border-gray-500 rounded-full cursor-ne-resize z-30" onMouseDown={(e) => handleResizeStart(e, index, 'ne')} />
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border border-gray-500 rounded-full cursor-nw-resize z-30" onMouseDown={(e) => handleResizeStart(e, index, 'nw')} />
              </>
            )}
          </div>
        );
      })}
      
      {/* Drawing mode visualization */}
      {isDrawingMode && drawingPoints.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {drawingPoints.map((point, idx) => (
            <div
              key={idx}
              className="absolute w-2 h-2 bg-axiom-cyan rounded-full border border-white transform -translate-x-1 -translate-y-1"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
              }}
            />
          ))}
          {drawingPoints.length > 1 && (
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
              <polyline
                points={drawingPoints.map(p => `${p.x},${p.y}`).join(' ')}
                stroke="#00E5FF"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4,4"
                style={{ vectorEffect: 'non-scaling-stroke' }}
              />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}