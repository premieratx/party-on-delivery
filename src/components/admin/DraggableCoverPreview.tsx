import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CoverPageConfig } from './CoverPageEditor';

interface DraggableElement {
  id: string;
  type: 'title' | 'subtitle' | 'logo' | 'checklist' | 'buttons';
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface DraggableCoverPreviewProps {
  config: CoverPageConfig;
  onPositionChange?: (elementId: string, x: number, y: number) => void;
  className?: string;
}

export const DraggableCoverPreview: React.FC<DraggableCoverPreviewProps> = ({
  config,
  onPositionChange,
  className = ""
}) => {
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [elements, setElements] = useState<DraggableElement[]>([
    { id: 'logo', type: 'logo', x: 50, y: 10 },
    { id: 'title', type: 'title', x: 50, y: 25 },
    { id: 'subtitle', type: 'subtitle', x: 50, y: 35 },
    { id: 'checklist', type: 'checklist', x: 50, y: 50 },
    { id: 'buttons', type: 'buttons', x: 50, y: 75 }
  ]);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const offsetX = e.clientX - rect.left - (element.x / 100) * rect.width;
    const offsetY = e.clientY - rect.top - (element.y / 100) * rect.height;

    setDraggedElement(elementId);
    setDragOffset({ x: offsetX, y: offsetY });
  }, [elements]);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent, elementId: string) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const touch = e.touches[0];
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const offsetX = touch.clientX - rect.left - (element.x / 100) * rect.width;
    const offsetY = touch.clientY - rect.top - (element.y / 100) * rect.height;

    setDraggedElement(elementId);
    setDragOffset({ x: offsetX, y: offsetY });
  }, [elements]);

  // Handle mouse/touch move
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!draggedElement || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((clientY - rect.top - dragOffset.y) / rect.height) * 100;

    // Constrain to container bounds
    const constrainedX = Math.max(0, Math.min(100, x));
    const constrainedY = Math.max(0, Math.min(100, y));

    setElements(prev => 
      prev.map(el => 
        el.id === draggedElement 
          ? { ...el, x: constrainedX, y: constrainedY }
          : el
      )
    );

    onPositionChange?.(draggedElement, constrainedX, constrainedY);
  }, [draggedElement, dragOffset, onPositionChange]);

  // Mouse event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      setDraggedElement(null);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      setDraggedElement(null);
    };

    if (draggedElement) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [draggedElement, handleMove]);

  const renderDraggableElement = (element: DraggableElement) => {
    const isDragging = draggedElement === element.id;
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}%`,
      top: `${element.y}%`,
      transform: 'translate(-50%, -50%)',
      cursor: isDragging ? 'grabbing' : 'grab',
      zIndex: isDragging ? 10 : 1,
      transition: isDragging ? 'none' : 'all 0.2s ease',
      border: isDragging ? '2px dashed #3b82f6' : '2px solid transparent',
      borderRadius: '4px',
      padding: '4px',
      userSelect: 'none',
      touchAction: 'none'
    };

    switch (element.type) {
      case 'logo':
        return (
          <div
            key={element.id}
            style={baseStyle}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onTouchStart={(e) => handleTouchStart(e, element.id)}
          >
            {config.logo_url ? (
              <img 
                src={config.logo_url} 
                alt="Logo"
                style={{ 
                  height: `${config.logo_height || 80}px`,
                  maxWidth: '200px',
                  objectFit: 'contain',
                  pointerEvents: 'none'
                }}
              />
            ) : (
              <div style={{ 
                width: '120px', 
                height: '60px', 
                backgroundColor: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Logo
              </div>
            )}
          </div>
        );

      case 'title':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              fontSize: `${config.styles?.title_size || 32}px`,
              fontWeight: 'bold',
              color: '#1f2937',
              textAlign: 'center',
              maxWidth: '80%',
              pointerEvents: isDragging ? 'none' : 'auto'
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onTouchStart={(e) => handleTouchStart(e, element.id)}
          >
            {config.title || 'Page Title'}
          </div>
        );

      case 'subtitle':
        return config.subtitle ? (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              fontSize: `${config.styles?.subtitle_size || 18}px`,
              color: '#6b7280',
              textAlign: 'center',
              maxWidth: '80%',
              pointerEvents: isDragging ? 'none' : 'auto'
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onTouchStart={(e) => handleTouchStart(e, element.id)}
          >
            {config.subtitle}
          </div>
        ) : null;

      case 'checklist':
        const validChecklist = config.checklist.filter(Boolean);
        return validChecklist.length > 0 ? (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              pointerEvents: isDragging ? 'none' : 'auto'
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onTouchStart={(e) => handleTouchStart(e, element.id)}
          >
            <div style={{ textAlign: 'center' }}>
              {validChecklist.map((item, index) => (
                <div 
                  key={index}
                  style={{
                    fontSize: `${config.styles?.checklist_size || 14}px`,
                    color: '#374151',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ 
                    width: '6px', 
                    height: '6px', 
                    backgroundColor: '#10b981',
                    borderRadius: '50%' 
                  }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'buttons':
        return config.buttons.length > 0 ? (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              pointerEvents: isDragging ? 'none' : 'auto'
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onTouchStart={(e) => handleTouchStart(e, element.id)}
          >
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: `${config.styles?.buttons_spacing || 12}px`,
              alignItems: 'center'
            }}>
              {config.buttons.map((button, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: button.bg_color || '#3b82f6',
                    color: button.text_color || '#ffffff',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    minWidth: '160px',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {button.text}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-gray-300 ${className}`}
      style={{ 
        height: '500px',
        backgroundImage: config.bg_image_url ? `url(${config.bg_image_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: config.styles?.background_color || undefined
      }}
    >
      {/* Grid overlay for positioning guidance */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="grid grid-cols-10 grid-rows-10 h-full">
          {Array.from({ length: 100 }, (_, i) => (
            <div key={i} className="border border-gray-400" />
          ))}
        </div>
      </div>

      {/* Draggable elements */}
      {elements.map(renderDraggableElement)}

      {/* Instructions */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
        Drag elements to reposition them
      </div>
    </div>
  );
};