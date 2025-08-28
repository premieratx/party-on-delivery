import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Palette, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const THEME_COLORS = [
  { name: 'Gold', primary: '45 93% 58%', secondary: '40 85% 50%', class: 'gold' },
  { name: 'Blue', primary: '217 91% 60%', secondary: '220 85% 55%', class: 'blue' },
  { name: 'Green', primary: '142 76% 36%', secondary: '140 70% 40%', class: 'green' },
  { name: 'Purple', primary: '270 90% 60%', secondary: '275 85% 55%', class: 'purple' },
  { name: 'Red', primary: '0 84% 60%', secondary: '5 80% 55%', class: 'red' },
  { name: 'Orange', primary: '25 95% 53%', secondary: '30 90% 50%', class: 'orange' },
  { name: 'Pink', primary: '330 85% 55%', secondary: '335 80% 50%', class: 'pink' },
  { name: 'Teal', primary: '180 85% 40%', secondary: '175 80% 45%', class: 'teal' },
  { name: 'Indigo', primary: '240 85% 60%', secondary: '245 80% 55%', class: 'indigo' },
  { name: 'Emerald', primary: '155 85% 35%', secondary: '160 80% 40%', class: 'emerald' },
];

interface ThemeColorToggleProps {
  className?: string;
}

export const ThemeColorToggle: React.FC<ThemeColorToggleProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);

  const applyThemeColor = (color: typeof THEME_COLORS[0]) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', color.primary);
    root.style.setProperty('--secondary', color.secondary);
    root.style.setProperty('--ring', color.primary);
    
    // Update brand-blue for titles and navigation
    if (color.class === 'blue') {
      root.style.setProperty('--brand-blue', color.primary);
    }
    
    // Theme applied silently
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
      >
        <Palette className="w-4 h-4 mr-2" />
        Theme Colors
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border p-4 min-w-[300px] max-w-[400px] z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Choose Theme Color</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {THEME_COLORS.map((color) => (
              <Button
                key={color.name}
                variant="outline"
                size="sm"
                onClick={() => applyThemeColor(color)}
                className="justify-start h-auto p-3 hover:shadow-md transition-shadow"
              >
                <div
                  className="w-6 h-6 rounded-full mr-3 border border-gray-300"
                  style={{ backgroundColor: `hsl(${color.primary})` }}
                />
                <div className="text-left">
                  <div className="font-medium text-sm">{color.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Primary: {color.primary}
                  </div>
                </div>
              </Button>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Live Preview:</strong> Changes apply instantly to tabs, buttons, and interface elements
            </p>
          </div>
        </div>
      )}
    </div>
  );
};