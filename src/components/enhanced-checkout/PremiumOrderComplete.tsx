import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Clock, MapPin, Share2, Download } from 'lucide-react';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface DeliveryInfo {
  address: string;
  date: string;
  time: string;
  instructions?: string;
}

interface PremiumOrderCompleteProps {
  // Content fields
  title: string;
  subtitle: string;
  logoUrl?: string;
  orderNumber: string;
  
  // Order data
  orderItems?: OrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  total?: number;
  deliveryInfo?: DeliveryInfo;
  
  // Buttons
  primaryButton: {
    text: string;
    url: string;
    color?: string;
    textColor?: string;
  };
  secondaryButton?: {
    text: string;
    url: string;
    color?: string;
    textColor?: string;
  };
  
  // Display options
  showOrderDetails: boolean;
  showDeliveryInfo: boolean;
  showShareOptions: boolean;
  
  // Style customizations
  theme: 'success' | 'celebration' | 'premium' | 'elegant';
  variant: 'original' | 'gold' | 'platinum';
  
  // Layout options
  className?: string;
  standalone?: boolean;
}

export const PremiumOrderComplete: React.FC<PremiumOrderCompleteProps> = ({
  title,
  subtitle,
  logoUrl,
  orderNumber,
  orderItems = [],
  subtotal = 0,
  deliveryFee = 0,
  total = 0,
  deliveryInfo,
  primaryButton,
  secondaryButton,
  showOrderDetails = true,
  showDeliveryInfo = true,
  showShareOptions = false,
  theme = 'success',
  variant = 'original',
  className,
  standalone = false
}) => {
  const getThemeStyles = () => {
    const themes = {
      success: {
        color: '#22c55e',
        bgGradient: 'from-green-50 to-emerald-50',
        iconBg: 'bg-green-100',
        cardBg: 'bg-green-50/50',
        textColor: 'text-green-800',
        badgeColor: 'bg-green-100 text-green-800'
      },
      celebration: {
        color: '#f59e0b',
        bgGradient: 'from-amber-50 to-yellow-50',
        iconBg: 'bg-amber-100',
        cardBg: 'bg-amber-50/50',
        textColor: 'text-amber-800',
        badgeColor: 'bg-amber-100 text-amber-800'
      },
      premium: {
        color: '#3b82f6',
        bgGradient: 'from-blue-50 to-indigo-50',
        iconBg: 'bg-blue-100',
        cardBg: 'bg-blue-50/50',
        textColor: 'text-blue-800',
        badgeColor: 'bg-blue-100 text-blue-800'
      },
      elegant: {
        color: '#8b5cf6',
        bgGradient: 'from-purple-50 to-violet-50',
        iconBg: 'bg-purple-100',
        cardBg: 'bg-purple-50/50',
        textColor: 'text-purple-800',
        badgeColor: 'bg-purple-100 text-purple-800'
      }
    };
    
    return themes[theme];
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'gold':
        return {
          container: 'bg-gradient-to-br from-amber-50 to-yellow-50 border-4 border-amber-300',
          frame: 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300',
          shimmer: 'from-transparent via-amber-200/20 to-transparent',
          badge: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900',
          shadow: 'shadow-amber-200/50'
        };
      
      case 'platinum':
        return {
          container: 'bg-gradient-to-br from-slate-50 via-zinc-50 to-slate-100 border border-slate-200',
          frame: 'bg-gradient-to-r from-slate-300 via-zinc-200 to-slate-300',
          shimmer: 'from-transparent via-slate-200/10 to-transparent',
          badge: 'bg-gradient-to-r from-slate-600 via-zinc-500 to-slate-600 text-white',
          shadow: 'shadow-slate-200/50'
        };
      
      default:
        return {
          container: 'bg-white',
          frame: '',
          shimmer: 'from-transparent via-white/5 to-transparent',
          badge: 'bg-primary/10 text-primary',
          shadow: 'shadow-lg'
        };
    }
  };

  const themeStyles = getThemeStyles();
  const variantStyles = getVariantStyles();
  
  const containerClass = standalone ? 
    `min-h-screen bg-gradient-to-br ${themeStyles.bgGradient} flex items-center justify-center p-4` :
    `min-h-screen bg-gradient-to-br ${themeStyles.bgGradient} flex items-center justify-center p-4`;

  return (
    <div className={`${containerClass} ${className || ''}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`relative w-full max-w-4xl ${variantStyles.container} rounded-3xl ${variantStyles.shadow} shadow-2xl overflow-hidden`}
      >
        {/* Frame effect for premium variants */}
        {variantStyles.frame && (
          <div className={`absolute inset-0 ${variantStyles.frame} p-2 rounded-3xl`}>
            <div className="w-full h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl" />
          </div>
        )}
        
        {/* Content */}
        <div className="relative p-8 md:p-12">
          
          {/* Success Icon & Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            className="text-center mb-8"
          >
            <div 
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${themeStyles.iconBg} mb-4`}
            >
              <CheckCircle 
                className="w-10 h-10" 
                style={{ color: themeStyles.color }} 
              />
            </div>
            
            {logoUrl && (
              <div className="mt-4">
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="h-12 mx-auto object-contain"
                />
              </div>
            )}
          </motion.div>
          
          {/* Title & Subtitle */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: themeStyles.color }}
            >
              {title}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={`text-xl ${themeStyles.textColor} mb-6`}
            >
              {subtitle}
            </motion.p>
            
            {/* Order Number Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className={`inline-block px-6 py-3 ${themeStyles.badgeColor} font-bold rounded-full text-lg shadow-lg`}
            >
              Order #{orderNumber}
            </motion.div>
          </div>
          
          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Order Details */}
            {showOrderDetails && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className={`${themeStyles.cardBg} rounded-2xl p-6 shadow-lg border border-white/50`}
              >
                <h3 className={`font-bold text-lg ${themeStyles.textColor} mb-4 flex items-center gap-2`}>
                  <Package className="w-5 h-5" />
                  Order Summary
                </h3>
                
                {orderItems.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {orderItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.quantity > 1 && (
                              <span className="text-sm text-muted-foreground ml-2">
                                x{item.quantity}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>${deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Delivery Information */}
            {showDeliveryInfo && deliveryInfo && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className={`${themeStyles.cardBg} rounded-2xl p-6 shadow-lg border border-white/50`}
              >
                <h3 className={`font-bold text-lg ${themeStyles.textColor} mb-4 flex items-center gap-2`}>
                  <MapPin className="w-5 h-5" />
                  Delivery Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="font-medium mb-1">Delivery Address</div>
                    <div className="text-sm text-muted-foreground">
                      {deliveryInfo.address}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium mb-1 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Date
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {deliveryInfo.date}
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium mb-1">Time</div>
                      <div className="text-sm text-muted-foreground">
                        {deliveryInfo.time}
                      </div>
                    </div>
                  </div>
                  
                  {deliveryInfo.instructions && (
                    <div>
                      <div className="font-medium mb-1">Special Instructions</div>
                      <div className="text-sm text-muted-foreground">
                        {deliveryInfo.instructions}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={primaryButton.url}
              className="px-8 py-4 font-bold rounded-xl text-center transition-all duration-200 shadow-lg hover:shadow-xl"
              style={{
                backgroundColor: primaryButton.color || themeStyles.color,
                color: primaryButton.textColor || 'white'
              }}
            >
              {primaryButton.text}
            </motion.a>
            
            {secondaryButton && (
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={secondaryButton.url}
                className={`px-8 py-4 font-bold rounded-xl text-center border-2 transition-all duration-200 shadow-lg hover:shadow-xl ${themeStyles.cardBg}`}
                style={{
                  borderColor: secondaryButton.color || themeStyles.color,
                  color: secondaryButton.textColor || themeStyles.color
                }}
              >
                {secondaryButton.text}
              </motion.a>
            )}
          </motion.div>
          
          {/* Share Options */}
          {showShareOptions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-8 text-center"
            >
              <div className="flex justify-center gap-4">
                <button className={`p-3 ${themeStyles.iconBg} rounded-full hover:scale-110 transition-transform`}>
                  <Share2 className="w-5 h-5" style={{ color: themeStyles.color }} />
                </button>
                <button className={`p-3 ${themeStyles.iconBg} rounded-full hover:scale-110 transition-transform`}>
                  <Download className="w-5 h-5" style={{ color: themeStyles.color }} />
                </button>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Shimmer overlay */}
        <div className={`absolute inset-0 bg-gradient-to-r ${variantStyles.shimmer} animate-shimmer pointer-events-none`} />
      </motion.div>
    </div>
  );
};

export default PremiumOrderComplete;