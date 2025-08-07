// Utility for tracking delivery app navigation for checkout returns
export const setDeliveryAppReferrer = (path: string) => {
  localStorage.setItem('deliveryAppReferrer', path);
};

export const getDeliveryAppReferrer = (): string => {
  return localStorage.getItem('deliveryAppReferrer') || '/';
};

export const clearDeliveryAppReferrer = () => {
  localStorage.removeItem('deliveryAppReferrer');
};