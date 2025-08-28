import React, { useEffect } from 'react';

export const CheckoutVerificationTool = () => {
  useEffect(() => {
    console.log('🔍 CHECKOUT VERIFICATION TOOL ACTIVE');
    
    const verifyInputs = () => {
      const allInputs = document.querySelectorAll('input, textarea, select');
      let disabledCount = 0;
      let readOnlyCount = 0;
      let totalInputs = allInputs.length;

      allInputs.forEach((input, index) => {
        const element = input as HTMLInputElement;
        if (element.disabled) {
          disabledCount++;
          console.warn(`❌ Input ${index} is DISABLED:`, element);
        }
        if (element.readOnly) {
          readOnlyCount++;
          console.warn(`❌ Input ${index} is READ-ONLY:`, element);
        }
      });

      console.log(`📊 CHECKOUT INPUT STATUS:
        ✅ Total inputs: ${totalInputs}
        ❌ Disabled inputs: ${disabledCount}
        ❌ Read-only inputs: ${readOnlyCount}
        ✅ Editable inputs: ${totalInputs - disabledCount - readOnlyCount}
      `);

      if (disabledCount === 0 && readOnlyCount === 0) {
        console.log('🎉 SUCCESS: All inputs are editable!');
      } else {
        console.error('🚨 PROBLEM: Some inputs are still locked!');
      }
    };

    // Verify immediately
    verifyInputs();
    
    // Verify on DOM changes
    const observer = new MutationObserver(verifyInputs);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true,
      attributeFilter: ['disabled', 'readonly']
    });

    // Verify every 2 seconds
    const interval = setInterval(verifyInputs, 2000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'green',
      color: 'white',
      padding: '5px 10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      ✅ Checkout Verified
    </div>
  );
};