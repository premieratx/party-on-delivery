import { useEffect, useCallback } from 'react';

interface AccessibilityOptions {
  announcePageChanges?: boolean;
  enableKeyboardNavigation?: boolean;
  enhanceColorContrast?: boolean;
  reduceMotion?: boolean;
}

export function useAccessibility(options: AccessibilityOptions = {}) {
  const {
    announcePageChanges = true,
    enableKeyboardNavigation = true,
    enhanceColorContrast = true,
    reduceMotion = true
  } = options;

  // Announce page changes to screen readers
  const announceToScreenReader = useCallback((message: string) => {
    if (!announcePageChanges) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [announcePageChanges]);

  // Enhanced keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip to main content with Alt+M
      if (event.altKey && event.key === 'm') {
        event.preventDefault();
        const main = document.querySelector('main') || document.querySelector('[role="main"]');
        if (main && main instanceof HTMLElement) {
          main.focus();
          announceToScreenReader('Jumped to main content');
        }
      }

      // Navigate between tabs with arrow keys
      if (event.target instanceof HTMLElement && 
          event.target.getAttribute('role') === 'tab') {
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        const currentIndex = tabs.indexOf(event.target);
        
        let nextIndex = currentIndex;
        
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % tabs.length;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        } else if (event.key === 'Home') {
          nextIndex = 0;
        } else if (event.key === 'End') {
          nextIndex = tabs.length - 1;
        }
        
        if (nextIndex !== currentIndex) {
          event.preventDefault();
          (tabs[nextIndex] as HTMLElement).focus();
          (tabs[nextIndex] as HTMLElement).click();
        }
      }

      // Enhanced search with keyboard shortcuts
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'k') {
          event.preventDefault();
          const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            announceToScreenReader('Search focused');
          }
        }
      }

      // Escape key to close modals/dropdowns
      if (event.key === 'Escape') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.getAttribute('role') === 'combobox') {
          (activeElement as HTMLElement).blur();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardNavigation, announceToScreenReader]);

  // Respect user's motion preferences
  useEffect(() => {
    if (!reduceMotion) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.style.setProperty('--animation-duration', '0.01s');
        document.documentElement.style.setProperty('--transition-duration', '0.01s');
      } else {
        document.documentElement.style.removeProperty('--animation-duration');
        document.documentElement.style.removeProperty('--transition-duration');
      }
    };

    handleMotionChange({ matches: mediaQuery.matches } as MediaQueryListEvent);
    mediaQuery.addEventListener('change', handleMotionChange);
    
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, [reduceMotion]);

  // Enhance color contrast for users who need it
  useEffect(() => {
    if (!enhanceColorContrast) return;

    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleContrastChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    };

    handleContrastChange({ matches: mediaQuery.matches } as MediaQueryListEvent);
    mediaQuery.addEventListener('change', handleContrastChange);
    
    return () => mediaQuery.removeEventListener('change', handleContrastChange);
  }, [enhanceColorContrast]);

  // Focus management helpers
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    if (firstFocusable) {
      firstFocusable.focus();
    }

    return () => container.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Add ARIA labels to interactive elements
  const enhanceInteractiveElements = useCallback(() => {
    // Add aria-label to buttons without text
    const iconButtons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    iconButtons.forEach((button) => {
      const icon = button.querySelector('svg');
      if (icon && !button.textContent?.trim()) {
        const ariaLabel = button.getAttribute('title') || 'Interactive button';
        button.setAttribute('aria-label', ariaLabel);
      }
    });

    // Ensure form inputs have labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach((input) => {
      const placeholder = input.getAttribute('placeholder');
      if (placeholder && !input.getAttribute('aria-label')) {
        input.setAttribute('aria-label', placeholder);
      }
    });

    // Add role and aria attributes to custom components
    const tabs = document.querySelectorAll('[data-tab]');
    tabs.forEach((tab, index) => {
      if (!tab.getAttribute('role')) {
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
        tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
      }
    });
  }, []);

  // Check color contrast
  const checkColorContrast = useCallback(() => {
    // This would typically use a color contrast library
    // For now, we'll add a data attribute that CSS can use
    const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, label');
    textElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.setAttribute('data-contrast-checked', 'true');
      }
    });
  }, []);

  return {
    announceToScreenReader,
    trapFocus,
    enhanceInteractiveElements,
    checkColorContrast
  };
}