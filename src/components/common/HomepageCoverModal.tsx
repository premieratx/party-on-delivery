import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';

interface CoverPageData {
  id: string;
  title: string;
  subtitle?: string;
  logo_url?: string;
  logo_height?: number;
  bg_image_url?: string;
  bg_video_url?: string;
  checklist: string[];
  buttons: Array<{
    text: string;
    type: 'delivery_app' | 'checkout' | 'url';
    app_slug?: string;
    url?: string;
    style?: 'filled' | 'outline';
  }>;
  styles?: any;
}

interface HomepageCoverModalProps {
  onAppSelect: (appSlug: string) => void;
  onDismiss: () => void;
}

const COVER_THEMES = {
  original: {
    name: 'Original',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    textColor: '#ffffff',
    subtitleColor: '#e2e8f0',
    buttonBg: '#ffffff',
    buttonText: '#667eea',
    buttonOutline: '#667eea',
    buttonOutlineText: '#667eea',
    glowColor: 'rgba(102, 126, 234, 0.3)',
    particles: false,
    particleColor: '#667eea'
  },
  gold: {
    name: 'Gold',
    background: 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)',
    primaryColor: '#F5B800',
    secondaryColor: '#FFD700',
    textColor: '#F5B800',
    subtitleColor: '#CCCCCC',
    buttonBg: '#F5B800',
    buttonText: '#000000',
    buttonOutline: '#F5B800',
    buttonOutlineText: '#F5B800',
    glowColor: 'rgba(245, 184, 0, 0.4)',
    particles: true,
    particleColor: '#F5B800'
  },
  platinum: {
    name: 'Platinum',
    background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
    primaryColor: '#BDC3C7',
    secondaryColor: '#ECF0F1',
    textColor: '#ECF0F1',
    subtitleColor: '#BDC3C7',
    buttonBg: '#ECF0F1',
    buttonText: '#2c3e50',
    buttonOutline: '#BDC3C7',
    buttonOutlineText: '#BDC3C7',
    glowColor: 'rgba(189, 195, 199, 0.3)',
    particles: false,
    particleColor: '#BDC3C7'
  }
};

export const HomepageCoverModal: React.FC<HomepageCoverModalProps> = ({ 
  onAppSelect, 
  onDismiss 
}) => {
  const [coverPage, setCoverPage] = useState<CoverPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof COVER_THEMES>('gold');

  useEffect(() => {
    const loadHomepageCover = async () => {
      try {
        // Check if user has already dismissed this today
        const lastDismissed = localStorage.getItem('homepage-cover-dismissed');
        const today = new Date().toDateString();
        
        if (lastDismissed === today) {
          setIsLoading(false);
          return;
        }

        // Load active homepage cover configuration
        const { data: coverConfig, error: configError } = await supabase
          .from('homepage_cover_config')
          .select(`
            cover_page_id,
            cover_pages (
              id,
              title,
              subtitle,
              logo_url,
              logo_height,
              bg_image_url,
              bg_video_url,
              checklist,
              buttons,
              styles
            )
          `)
          .eq('is_active', true)
          .maybeSingle();

        if (configError || !coverConfig?.cover_pages) {
          setIsLoading(false);
          return;
        }

        const coverData = coverConfig.cover_pages as any;
        setCoverPage(coverData);
        
        // Set theme from styles if available
        if (coverData.styles?.theme) {
          setSelectedTheme(coverData.styles.theme);
        }
        
      } catch (error) {
        console.error('Error loading homepage cover:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomepageCover();
  }, []);

  const handleButtonClick = (button: CoverPageData['buttons'][0]) => {
    if (button.type === 'delivery_app' && button.app_slug) {
      onAppSelect(button.app_slug);
    } else if (button.type === 'url' && button.url) {
      window.open(button.url, '_blank');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('homepage-cover-dismissed', new Date().toDateString());
    onDismiss();
  };

  if (isLoading || !coverPage) {
    return null;
  }

  const theme = COVER_THEMES[selectedTheme];

  const renderParticles = () => {
    if (!theme.particles) return null;

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 animate-pulse"
            style={{
              width: Math.random() * 8 + 4 + 'px',
              height: Math.random() * 8 + 4 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              backgroundColor: theme.particleColor,
              animationDelay: Math.random() * 3 + 's',
              animationDuration: (Math.random() * 3 + 2) + 's'
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={true} onOpenChange={handleDismiss}>
      <DialogContent 
        className="max-w-md w-full p-0 border-none bg-transparent shadow-2xl"
      >
        <div
          className="relative w-full h-[600px] rounded-2xl overflow-hidden"
          style={{
            background: coverPage.bg_image_url ? `url(${coverPage.bg_image_url})` : 
                       coverPage.bg_video_url ? 'black' : theme.background,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-20 text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Background Video */}
          {coverPage.bg_video_url && (
            <video
              autoPlay
              loop
              muted
              className="absolute inset-0 w-full h-full object-cover"
              src={coverPage.bg_video_url}
            />
          )}
          
          {renderParticles()}
          
          <div className="relative z-10 h-full flex flex-col justify-center items-center space-y-6 p-8">
            {/* Logo */}
            {coverPage.logo_url && (
              <div 
                className="flex items-center justify-center"
                style={{
                  filter: theme.glowColor ? `drop-shadow(0 0 20px ${theme.glowColor})` : 'none'
                }}
              >
                <img 
                  src={coverPage.logo_url} 
                  alt="Logo" 
                  style={{ height: coverPage.logo_height || 120 }}
                  className="object-contain"
                />
              </div>
            )}

            {/* Title */}
            <h1 
              className="text-3xl font-bold text-center px-4"
              style={{ 
                color: theme.textColor,
                textShadow: theme.glowColor ? `0 0 30px ${theme.glowColor}` : 'none'
              }}
            >
              {coverPage.title}
            </h1>

            {/* Subtitle */}
            {coverPage.subtitle && (
              <p 
                className="text-lg text-center px-4"
                style={{ color: theme.subtitleColor }}
              >
                {coverPage.subtitle}
              </p>
            )}

            {/* Checklist */}
            {coverPage.checklist && coverPage.checklist.length > 0 && (
              <div className="space-y-2 px-4">
                {coverPage.checklist.filter(Boolean).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-center gap-3">
                    <span style={{ color: theme.primaryColor }}>
                      {selectedTheme === 'gold' ? '🥂' : '✓'}
                    </span>
                    <span style={{ color: theme.subtitleColor }} className="text-sm">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Buttons */}
            {coverPage.buttons && coverPage.buttons.length > 0 && (
              <div className="space-y-3 px-4 w-full max-w-xs">
                {coverPage.buttons.map((button, idx) => (
                  <Button
                    key={idx}
                    onClick={() => handleButtonClick(button)}
                    className="w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                    style={{
                      backgroundColor: button.style === 'filled' ? theme.buttonBg : 'transparent',
                      color: button.style === 'filled' ? theme.buttonText : (theme.buttonOutlineText || theme.primaryColor),
                      border: button.style === 'outline' ? `2px solid ${theme.buttonOutline || theme.primaryColor}` : 'none',
                      boxShadow: button.style === 'filled' ? `0 4px 15px ${theme.glowColor}` : 'none'
                    }}
                  >
                    {button.text}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};