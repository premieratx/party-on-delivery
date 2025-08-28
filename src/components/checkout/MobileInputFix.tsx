import React from 'react';

export const MobileInputFix = () => {
  React.useEffect(() => {
    console.log('📱 UNIVERSAL MOBILE INPUT FIX - ALL DEVICES & PAGES');
    
    const universalMobileFix = () => {
      // Target ALL possible form elements
      const selectors = [
        'input', 'textarea', 'select', 'button',
        '[contenteditable]', '[role="textbox"]', '[role="combobox"]',
        '.input', '.textarea', '.select'
      ];
      
      document.querySelectorAll(selectors.join(', ')).forEach(input => {
        const element = input as HTMLElement;
        
        // Mobile-specific fixes
        element.style.fontSize = Math.max(16, parseFloat(getComputedStyle(element).fontSize)) + 'px';
        element.style.touchAction = 'manipulation';
        (element.style as any).webkitTapHighlightColor = 'transparent';
        
        // Universal enablement
        if ('disabled' in element) (element as HTMLInputElement).disabled = false;
        if ('readOnly' in element) (element as HTMLInputElement).readOnly = false;
        
        element.removeAttribute('readonly');
        element.removeAttribute('disabled');
        element.removeAttribute('data-disabled');
        element.removeAttribute('aria-disabled');
        
        // Force interaction
        element.style.pointerEvents = 'auto';
        element.style.userSelect = 'text';
        element.style.webkitUserSelect = 'text';
        element.style.cursor = 'text';
        element.style.opacity = '1';
        
        // Remove disabled classes
        element.classList.remove('disabled', 'readonly');
      });
      
      // Fix any container restrictions
      document.querySelectorAll('[data-disabled], .disabled').forEach(container => {
        container.removeAttribute('data-disabled');
        container.classList.remove('disabled');
      });
    };

    // Run immediately and continuously
    universalMobileFix();
    const observer = new MutationObserver(universalMobileFix);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true,
      attributeFilter: ['disabled', 'readonly', 'data-disabled', 'aria-disabled', 'class']
    });

    // Handle all interaction events
    ['focusin', 'touchstart', 'click', 'mousedown'].forEach(event => {
      document.addEventListener(event, universalMobileFix, { passive: true });
    });

    return () => {
      observer.disconnect();
      ['focusin', 'touchstart', 'click', 'mousedown'].forEach(event => {
        document.removeEventListener(event, universalMobileFix);
      });
    };
  }, []);

  return null;
};