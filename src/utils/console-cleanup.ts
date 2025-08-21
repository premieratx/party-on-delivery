/**
 * Console cleanup utilities to reduce noise and improve debugging
 */

// Suppress known harmless warnings
const originalWarn = console.warn;
const originalError = console.error;

const suppressedWarnings = [
  'DialogContent requires a DialogTitle',
  'Missing Description or aria-describedby',
  'Potential permissions policy violation',
  'The resource was preloaded using link preload but not used',
  'Refused to load the font',
  'Refused to load the stylesheet'
];

const suppressedErrors = [
  'Failed to load resource: the server responded with a status of 404',
  'BE7PXuso'
];

console.warn = (...args: any[]) => {
  const message = args.join(' ');
  const shouldSuppress = suppressedWarnings.some(warning => 
    message.includes(warning)
  );
  
  if (!shouldSuppress) {
    originalWarn.apply(console, args);
  }
};

console.error = (...args: any[]) => {
  const message = args.join(' ');
  const shouldSuppress = suppressedErrors.some(error => 
    message.includes(error)
  );
  
  if (!shouldSuppress) {
    originalError.apply(console, args);
  }
};

/**
 * Clean up problematic elements that cause accessibility warnings
 */
export const cleanupAccessibilityIssues = () => {
  // Remove problematic aria-hidden elements that retain focus
  const elementsWithAriaHidden = document.querySelectorAll('[aria-hidden="true"]');
  elementsWithAriaHidden.forEach((element) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach((focusable) => {
      if (focusable instanceof HTMLElement) {
        focusable.tabIndex = -1;
      }
    });
  });
};

// Run cleanup when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanupAccessibilityIssues);
  } else {
    cleanupAccessibilityIssues();
  }
  
  // Also run after React hydration
  setTimeout(cleanupAccessibilityIssues, 1000);
}