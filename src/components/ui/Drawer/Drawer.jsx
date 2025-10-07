// src/components/ui/Drawer/Drawer.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './Drawer.css';

const Drawer = ({
  isOpen = false,
  onClose,
  children,
  title,
  description,
  height = "70vh",
  showOverlay = true,
  closeOnOverlay = false,
  closeOnScrollDown = true,
  className = ""
}) => {
  // States
  const [isAnimating, setIsAnimating] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const drawerRef = useRef(null);
  const contentRef = useRef(null);
  const overlayRef = useRef(null);

  // Close handler con animazione
  const handleClose = useCallback(() => {
    if (isAnimating || !onClose) return;
    
    setIsAnimating(true);
    
    if (drawerRef.current) {
      drawerRef.current.classList.remove('drawer--open');
      drawerRef.current.classList.add('drawer--closing');
    }
    
    setTimeout(() => {
      onClose();
      setIsAnimating(false);
      setCurrentY(0);
      setIsDragging(false);
    }, 300);
  }, [isAnimating, onClose]);

  // Gesture handlers per scroll-down close
  const handleTouchStart = useCallback((e) => {
    if (!closeOnScrollDown) return;
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  }, [closeOnScrollDown]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || !closeOnScrollDown) return;
    
    const currentYPos = e.touches[0].clientY;
    const deltaY = currentYPos - startY;
    
    // Solo se scroll verso il basso
    if (deltaY > 0) {
      setCurrentY(deltaY);
      
      if (contentRef.current) {
        const progress = Math.min(deltaY / 200, 1);
        contentRef.current.style.transform = `translateY(${deltaY}px)`;
        contentRef.current.style.opacity = `${1 - progress * 0.3}`;
      }
    }
  }, [isDragging, startY, closeOnScrollDown]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || !closeOnScrollDown) return;
    
    setIsDragging(false);
    
    // Se trascinato abbastanza, chiudi
    if (currentY > 100) {
      handleClose();
    } else {
      // Ritorna alla posizione originale
      if (contentRef.current) {
        contentRef.current.style.transform = '';
        contentRef.current.style.opacity = '';
      }
      setCurrentY(0);
    }
  }, [isDragging, currentY, closeOnScrollDown, handleClose]);

  // Mouse events per desktop
  const handleMouseDown = useCallback((e) => {
    if (!closeOnScrollDown) return;
    setStartY(e.clientY);
    setIsDragging(true);
  }, [closeOnScrollDown]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !closeOnScrollDown) return;
    
    const deltaY = e.clientY - startY;
    if (deltaY > 0) {
      setCurrentY(deltaY);
      
      if (contentRef.current) {
        const progress = Math.min(deltaY / 200, 1);
        contentRef.current.style.transform = `translateY(${deltaY}px)`;
        contentRef.current.style.opacity = `${1 - progress * 0.3}`;
      }
    }
  }, [isDragging, startY, closeOnScrollDown]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !closeOnScrollDown) return;
    
    setIsDragging(false);
    
    if (currentY > 100) {
      handleClose();
    } else {
      if (contentRef.current) {
        contentRef.current.style.transform = '';
        contentRef.current.style.opacity = '';
      }
      setCurrentY(0);
    }
  }, [isDragging, currentY, closeOnScrollDown, handleClose]);

  // Click overlay handler
  const handleOverlayClick = useCallback((e) => {
    if (closeOnOverlay && e.target === overlayRef.current) {
      handleClose();
    }
  }, [closeOnOverlay, handleClose]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClose]);

  // Setup gesture listeners
  useEffect(() => {
    const content = contentRef.current;
    if (!content || !isOpen) return;

    // Touch events
    content.addEventListener('touchstart', handleTouchStart, { passive: false });
    content.addEventListener('touchmove', handleTouchMove, { passive: false });
    content.addEventListener('touchend', handleTouchEnd);

    // Mouse events per desktop
    content.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      content.removeEventListener('touchstart', handleTouchStart);
      content.removeEventListener('touchmove', handleTouchMove);
      content.removeEventListener('touchend', handleTouchEnd);
      content.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Non renderizzare se chiuso
  if (!isOpen) return null;

  const drawerContent = (
    <div 
      ref={drawerRef}
      className={`drawer ${isAnimating ? 'drawer--animating' : ''} drawer--open ${className}`}
    >
      {/* Overlay */}
      {showOverlay && (
        <div 
          ref={overlayRef}
          className="drawer__overlay"
          onClick={handleOverlayClick}
        />
      )}

      {/* Content */}
      <div 
        ref={contentRef}
        className="drawer__content"
        style={{ height }}
      >
        {/* Handle per gesture */}
        {closeOnScrollDown && (
          <div className="drawer__handle">
            <div className="drawer__handle-bar" />
          </div>
        )}

        {/* Header */}
        {(title || description) && (
          <div className="drawer__header">
            <div className="drawer__header-text">
              {title && (
                <h2 className="drawer__title">{title}</h2>
              )}
              {description && (
                <p className="drawer__description">{description}</p>
              )}
            </div>
            <button 
              className="drawer__close-btn"
              onClick={handleClose}
              aria-label="Chiudi drawer"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="drawer__body">
          {children}
        </div>
      </div>
    </div>
  );

  // Renderizza in portal
  return createPortal(drawerContent, document.body);
};

export default Drawer;