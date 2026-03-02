import { useCallback, useEffect, useRef } from 'react';

/**
 * Accessibility Utilities Hook
 * Provides keyboard navigation, focus management, and ARIA helpers
 */

/**
 * Trap focus within a modal or dialog
 * @param {boolean} isActive - Whether the focus trap is active
 * @returns {React.RefObject} Ref to attach to the container element
 */
export function useFocusTrap(isActive) {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement;

      // Focus the first focusable element in the container
      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    } else if (previousFocusRef.current) {
      // Restore focus when trap is deactivated
      previousFocusRef.current.focus();
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab on first element -> wrap to last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // Tab on last element -> wrap to first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    const container = containerRef.current;
    container?.addEventListener('keydown', handleKeyDown);

    return () => {
      container?.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container) {
  if (!container) return [];

  const selector = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]'
  ].join(', ');

  return Array.from(container.querySelectorAll(selector))
    .filter(el => {
      // Filter out hidden elements
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

/**
 * Handle keyboard navigation for lists (arrow keys, home, end)
 * @param {Array} items - Array of items
 * @param {Function} onSelect - Callback when an item is selected
 * @param {number} initialIndex - Initial selected index
 */
export function useListNavigation(items, onSelect, initialIndex = -1) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const itemRefs = useRef([]);

  const handleKeyDown = useCallback((e) => {
    if (items.length === 0) return;

    let newIndex = selectedIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        newIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
        break;
      case 'ArrowUp':
        e.preventDefault();
        newIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          onSelect(items[selectedIndex], selectedIndex);
        }
        return;
      default:
        return;
    }

    setSelectedIndex(newIndex);
    itemRefs.current[newIndex]?.focus();
  }, [items, selectedIndex, onSelect]);

  const setItemRef = useCallback((index) => (el) => {
    itemRefs.current[index] = el;
  }, []);

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    setItemRef,
    itemRefs
  };
}

import { useState } from 'react';

/**
 * Generate unique IDs for ARIA attributes
 */
let idCounter = 0;
export function useUniqueId(prefix = 'id') {
  const [id] = useState(() => `${prefix}-${++idCounter}`);
  return id;
}

/**
 * ARIA live region hook for announcing changes to screen readers
 */
export function useAnnouncer() {
  const announce = useCallback((message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement is read
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return announce;
}

/**
 * Hook for managing expanded/collapsed state with ARIA attributes
 */
export function useExpandable(initialState = false) {
  const [isExpanded, setIsExpanded] = useState(initialState);
  const contentId = useUniqueId('content');
  const triggerId = useUniqueId('trigger');

  const toggle = useCallback(() => setIsExpanded(prev => !prev), []);
  const expand = useCallback(() => setIsExpanded(true), []);
  const collapse = useCallback(() => setIsExpanded(false), []);

  const triggerProps = {
    id: triggerId,
    'aria-expanded': isExpanded,
    'aria-controls': contentId,
    onClick: toggle
  };

  const contentProps = {
    id: contentId,
    'aria-labelledby': triggerId,
    role: 'region'
  };

  return {
    isExpanded,
    toggle,
    expand,
    collapse,
    triggerProps,
    contentProps
  };
}

/**
 * Hook for skip link functionality
 */
export function useSkipLink(mainContentId = 'main-content') {
  const handleSkip = useCallback((e) => {
    e.preventDefault();
    const mainContent = document.getElementById(mainContentId);
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mainContentId]);

  return {
    skipLinkProps: {
      href: `#${mainContentId}`,
      onClick: handleSkip,
      className: 'skip-link'
    },
    mainContentProps: {
      id: mainContentId,
      tabIndex: -1 // Make focusable but not in tab order
    }
  };
}

/**
 * Generate ARIA attributes for common patterns
 */
export const ariaPatterns = {
  // Button with loading state
  loadingButton: (isLoading, loadingText) => ({
    'aria-busy': isLoading,
    'aria-label': isLoading ? loadingText : undefined
  }),

  // Progress indicator
  progress: (value, max = 100, label) => ({
    role: 'progressbar',
    'aria-valuenow': value,
    'aria-valuemin': 0,
    'aria-valuemax': max,
    'aria-label': label
  }),

  // Alert/Status message
  alert: (type = 'status') => ({
    role: type === 'error' ? 'alert' : 'status',
    'aria-live': type === 'error' ? 'assertive' : 'polite',
    'aria-atomic': 'true'
  }),

  // Dialog/Modal
  dialog: (isOpen, titleId) => ({
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': titleId,
    'aria-hidden': !isOpen
  }),

  // Tab panel
  tabPanel: (isSelected, labelledBy) => ({
    role: 'tabpanel',
    'aria-labelledby': labelledBy,
    hidden: !isSelected
  }),

  // Tab list
  tabList: () => ({
    role: 'tablist'
  }),

  // Individual tab
  tab: (isSelected, controlsId) => ({
    role: 'tab',
    'aria-selected': isSelected,
    'aria-controls': controlsId,
    tabIndex: isSelected ? 0 : -1
  }),

  // Listbox (for selectable lists)
  listbox: (labelledBy) => ({
    role: 'listbox',
    'aria-labelledby': labelledBy
  }),

  // Listbox option
  listboxOption: (isSelected, isDisabled = false) => ({
    role: 'option',
    'aria-selected': isSelected,
    'aria-disabled': isDisabled
  }),

  // Switch/Toggle
  switch: (isChecked, label) => ({
    role: 'switch',
    'aria-checked': isChecked,
    'aria-label': label
  }),

  // Tooltip
  tooltip: (id) => ({
    role: 'tooltip',
    id
  }),

  // Menu
  menu: (labelledBy) => ({
    role: 'menu',
    'aria-labelledby': labelledBy
  }),

  // Menu item
  menuItem: () => ({
    role: 'menuitem'
  })
};

export default {
  useFocusTrap,
  useListNavigation,
  useUniqueId,
  useAnnouncer,
  useExpandable,
  useSkipLink,
  ariaPatterns
};
