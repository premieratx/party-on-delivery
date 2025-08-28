import React from 'react';

export const MobileInputFix = () => {
  React.useEffect(() => {
    console.log('✅ Universal mobile input access enabled');
    
    const makeAllInputsWork = () => {
      document.querySelectorAll('input, textarea, select').forEach(input => {
        const element = input as HTMLInputElement;
        element.disabled = false;
        element.readOnly = false;
        element.removeAttribute('readonly');
        element.removeAttribute('disabled');
        element.style.pointerEvents = 'auto';
        element.style.touchAction = 'manipulation';
        element.style.fontSize = '16px';
        element.style.userSelect = 'text';
        element.style.webkitUserSelect = 'text';
      });
    };

    makeAllInputsWork();
    const observer = new MutationObserver(makeAllInputsWork);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
};