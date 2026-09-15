'use client';

import { useEffect, useRef, useState } from 'react';

export default function useSidebarDrawer() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const swipeStartRef = useRef({ x: 0, y: 0 });
  const swipeDeltaRef = useRef({ x: 0, y: 0 });
  const sidebarRef = useRef(null);
  const sidebarTriggerRef = useRef(null);

  const isCollapsedView = isSidebarCollapsed && !isMobileSidebarOpen;

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMobileSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    const closeButton = sidebarRef.current?.querySelector('button');
    const sidebarTrigger = sidebarTriggerRef.current;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    closeButton?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      if (sidebarTrigger?.offsetParent !== null) {
        sidebarTrigger?.focus();
      }
    };
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');

    const handleDesktopEnter = (event) => {
      setIsDesktopViewport(event.matches);
      if (event.matches) {
        setIsMobileSidebarOpen(false);
      }
    };

    setIsDesktopViewport(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleDesktopEnter);
    return () => mediaQuery.removeEventListener('change', handleDesktopEnter);
  }, []);

  function handleSidebarTouchStart(event) {
    const touch = event.touches[0];
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
    swipeDeltaRef.current = { x: 0, y: 0 };
  }

  function handleSidebarTouchMove(event) {
    const touch = event.touches[0];
    swipeDeltaRef.current = {
      x: touch.clientX - swipeStartRef.current.x,
      y: touch.clientY - swipeStartRef.current.y,
    };
  }

  function handleSidebarTouchEnd() {
    const { x, y } = swipeDeltaRef.current;
    const isHorizontalSwipe = Math.abs(x) > Math.abs(y);

    if (isMobileSidebarOpen && isHorizontalSwipe && x < -70) {
      setIsMobileSidebarOpen(false);
    }

    swipeStartRef.current = { x: 0, y: 0 };
    swipeDeltaRef.current = { x: 0, y: 0 };
  }

  return {
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isDesktopViewport,
    isCollapsedView,
    sidebarRef,
    sidebarTriggerRef,
    handleSidebarTouchStart,
    handleSidebarTouchMove,
    handleSidebarTouchEnd,
  };
}
