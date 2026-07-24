'use client';

import { useEffect, useRef, useState } from 'react';

export default function useSidebarDrawer() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const swipeStartRef = useRef({ x: 0, y: 0 });
  const swipeDeltaRef = useRef({ x: 0, y: 0 });

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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');

    const handleDesktopEnter = (event) => {
      if (event.matches) {
        setIsMobileSidebarOpen(false);
      }
    };

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
    isCollapsedView,
    handleSidebarTouchStart,
    handleSidebarTouchMove,
    handleSidebarTouchEnd,
  };
}
