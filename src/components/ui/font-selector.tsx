import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Type, Bold, Italic, Underline } from 'lucide-react';

interface FontStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  color: string;
}

interface FontSelectorProps {
  value: FontStyle;
  onChange: (style: FontStyle) => void;
}

const FONT_FAMILIES = [
  'Inter',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
  'Palatino',
  'Garamond',
  'Bookman',
  'Avant Garde',
];

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#008000', '#000080', '#808080', '#FFC0CB', '#A52A2A'
];

export const FontSelector: React.FC<FontSelectorProps> = ({ value, onChange }) => {
  const updateStyle = (updates: Partial<FontStyle>) => {
    onChange({ ...value, ...updates });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Type className="h-4 w-4" />
          Font Style
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Font Family</label>
          <Select value={value.fontFamily} onValueChange={(fontFamily) => updateStyle({ fontFamily })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Font Size: {value.fontSize}px</label>
          <Slider
            value={[value.fontSize]}
            onValueChange={([fontSize]) => updateStyle({ fontSize })}
            min={12}
            max={72}
            step={1}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={value.fontWeight === 'bold' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateStyle({ 
              fontWeight: value.fontWeight === 'bold' ? 'normal' : 'bold' 
            })}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={value.fontStyle === 'italic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateStyle({ 
              fontStyle: value.fontStyle === 'italic' ? 'normal' : 'italic' 
            })}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={value.textDecoration === 'underline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateStyle({ 
              textDecoration: value.textDecoration === 'underline' ? 'none' : 'underline' 
            })}
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Color</label>
          <div className="grid grid-cols-5 gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                className={`w-8 h-8 rounded border-2 ${
                  value.color === color ? 'border-primary' : 'border-border'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => updateStyle({ color })}
              />
            ))}
          </div>
          <input
            type="color"
            value={value.color}
            onChange={(e) => updateStyle({ color: e.target.value })}
            className="w-full h-8 rounded border"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Preview</label>
          <div 
            className="p-2 border rounded"
            style={{
              fontFamily: value.fontFamily,
              fontSize: `${value.fontSize}px`,
              fontWeight: value.fontWeight,
              fontStyle: value.fontStyle,
              textDecoration: value.textDecoration,
              color: value.color,
            }}
          >
            Sample Text
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};