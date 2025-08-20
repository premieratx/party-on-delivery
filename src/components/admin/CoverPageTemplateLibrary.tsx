import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Star, 
  Download, 
  Upload, 
  Eye, 
  Copy,
  Bookmark,
  Filter,
  Grid,
  List,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Template types
interface CoverPageTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'creative' | 'minimal' | 'bold' | 'elegant' | 'modern';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  preview_image: string;
  config: {
    background: string;
    colors: {
      primary: string;
      secondary: string;
      text: string;
      accent: string;
    };
    typography: {
      headingFont: string;
      bodyFont: string;
      headingSize: string;
      bodySize: string;
    };
    layout: 'center' | 'left' | 'right' | 'split';
    components: any[];
  };
  usage_count: number;
  rating: number;
  is_premium: boolean;
  created_by: string;
  created_at: string;
}

// Predefined templates
const BUILT_IN_TEMPLATES: CoverPageTemplate[] = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean, professional design perfect for SaaS and tech companies',
    category: 'minimal',
    difficulty: 'beginner',
    tags: ['clean', 'professional', 'tech', 'saas'],
    preview_image: '/api/placeholder/400/300',
    config: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        text: '#ffffff',
        accent: '#a855f7'
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        headingSize: '3rem',
        bodySize: '1.125rem'
      },
      layout: 'center',
      components: []
    },
    usage_count: 245,
    rating: 4.8,
    is_premium: false,
    created_by: 'System',
    created_at: '2024-01-01'
  },
  {
    id: 'vibrant-energy',
    name: 'Vibrant Energy',
    description: 'Bold, colorful design that grabs attention and energizes visitors',
    category: 'bold',
    difficulty: 'intermediate',
    tags: ['colorful', 'energetic', 'bold', 'creative'],
    preview_image: '/api/placeholder/400/300',
    config: {
      background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1)',
      colors: {
        primary: '#ff6b6b',
        secondary: '#4ecdc4',
        text: '#ffffff',
        accent: '#45b7d1'
      },
      typography: {
        headingFont: 'Poppins',
        bodyFont: 'Open Sans',
        headingSize: '3.5rem',
        bodySize: '1rem'
      },
      layout: 'center',
      components: []
    },
    usage_count: 189,
    rating: 4.6,
    is_premium: false,
    created_by: 'System',
    created_at: '2024-01-01'
  },
  {
    id: 'elegant-dark',
    name: 'Elegant Dark',
    description: 'Sophisticated dark theme perfect for luxury brands and premium services',
    category: 'elegant',
    difficulty: 'intermediate',
    tags: ['dark', 'luxury', 'premium', 'sophisticated'],
    preview_image: '/api/placeholder/400/300',
    config: {
      background: 'linear-gradient(180deg, #2c3e50 0%, #34495e 100%)',
      colors: {
        primary: '#ecf0f1',
        secondary: '#bdc3c7',
        text: '#ecf0f1',
        accent: '#e74c3c'
      },
      typography: {
        headingFont: 'Playfair Display',
        bodyFont: 'Lato',
        headingSize: '2.75rem',
        bodySize: '1.125rem'
      },
      layout: 'center',
      components: []
    },
    usage_count: 167,
    rating: 4.9,
    is_premium: true,
    created_by: 'System',
    created_at: '2024-01-01'
  },
  {
    id: 'startup-landing',
    name: 'Startup Landing',
    description: 'Perfect for startups and new businesses launching their product',
    category: 'business',
    difficulty: 'beginner',
    tags: ['startup', 'business', 'launch', 'conversion'],
    preview_image: '/api/placeholder/400/300',
    config: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        text: '#ffffff',
        accent: '#f59e0b'
      },
      typography: {
        headingFont: 'Montserrat',
        bodyFont: 'Source Sans Pro',
        headingSize: '3.25rem',
        bodySize: '1.25rem'
      },
      layout: 'center',
      components: []
    },
    usage_count: 312,
    rating: 4.7,
    is_premium: false,
    created_by: 'System',
    created_at: '2024-01-01'
  },
  {
    id: 'creative-portfolio',
    name: 'Creative Portfolio',
    description: 'Showcase your creative work with this artistic and unique design',
    category: 'creative',
    difficulty: 'advanced',
    tags: ['portfolio', 'creative', 'artistic', 'showcase'],
    preview_image: '/api/placeholder/400/300',
    config: {
      background: 'radial-gradient(circle at center, #ffecd2 0%, #fcb69f 100%)',
      colors: {
        primary: '#2d3748',
        secondary: '#4a5568',
        text: '#2d3748',
        accent: '#ed8936'
      },
      typography: {
        headingFont: 'Oswald',
        bodyFont: 'Nunito',
        headingSize: '3.75rem',
        bodySize: '1.125rem'
      },
      layout: 'left',
      components: []
    },
    usage_count: 98,
    rating: 4.5,
    is_premium: true,
    created_by: 'System',
    created_at: '2024-01-01'
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyberpunk',
    description: 'Futuristic cyberpunk aesthetic with neon accents and bold typography',
    category: 'bold',
    difficulty: 'advanced',
    tags: ['cyberpunk', 'neon', 'futuristic', 'gaming'],
    preview_image: '/api/placeholder/400/300',
    config: {
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)',
      colors: {
        primary: '#00ff41',
        secondary: '#ff0080',
        text: '#ffffff',
        accent: '#00d4ff'
      },
      typography: {
        headingFont: 'Orbitron',
        bodyFont: 'Exo 2',
        headingSize: '3.5rem',
        bodySize: '1rem'
      },
      layout: 'center',
      components: []
    },
    usage_count: 76,
    rating: 4.3,
    is_premium: true,
    created_by: 'System',
    created_at: '2024-01-01'
  }
];

// Template Card Component
const TemplateCard = React.memo(({ 
  template, 
  isSelected, 
  onSelect, 
  onApply,
  onFavorite
}: {
  template: CoverPageTemplate;
  isSelected: boolean;
  onSelect: (template: CoverPageTemplate) => void;
  onApply: (template: CoverPageTemplate) => void;
  onFavorite: (template: CoverPageTemplate) => void;
}) => (
  <Card 
    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
      isSelected ? 'ring-2 ring-primary' : ''
    }`}
    onClick={() => onSelect(template)}
  >
    <div className="aspect-video relative overflow-hidden">
      <div 
        className="w-full h-full flex items-center justify-center text-white text-sm font-medium"
        style={{ background: template.config.background }}
      >
        {template.name}
      </div>
      
      {/* Overlay with actions */}
      <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onApply(template);
            }}
          >
            <Download className="w-4 h-4 mr-1" />
            Use
          </Button>
          <Button 
            size="sm" 
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(template);
            }}
          >
            <Star className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
    
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm">{template.name}</h3>
        <div className="flex items-center gap-1">
          {template.is_premium && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Pro
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {template.category}
          </Badge>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
        {template.description}
      </p>
      
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span>{template.rating}</span>
          <span className="text-muted-foreground">({template.usage_count})</span>
        </div>
        
        <Badge 
          variant={template.difficulty === 'beginner' ? 'default' : 
                  template.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
          className="text-xs"
        >
          {template.difficulty}
        </Badge>
      </div>
      
      {/* Tags */}
      <div className="flex flex-wrap gap-1 mt-2">
        {template.tags.slice(0, 3).map(tag => (
          <Badge key={tag} variant="outline" className="text-xs px-1">
            {tag}
          </Badge>
        ))}
      </div>
    </CardContent>
  </Card>
));

export const CoverPageTemplateLibrary: React.FC<{
  onApplyTemplate: (template: CoverPageTemplate) => void;
  selectedCategory?: string;
}> = ({ onApplyTemplate, selectedCategory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<CoverPageTemplate | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Memoized filtered templates
  const filteredTemplates = useMemo(() => {
    return BUILT_IN_TEMPLATES.filter(template => {
      // Search filter
      if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !template.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
        return false;
      }
      
      // Category filter
      if (filterCategory !== 'all' && template.category !== filterCategory) {
        return false;
      }
      
      // Difficulty filter
      if (filterDifficulty !== 'all' && template.difficulty !== filterDifficulty) {
        return false;
      }
      
      return true;
    });
  }, [searchQuery, filterCategory, filterDifficulty]);

  const handleApplyTemplate = useCallback((template: CoverPageTemplate) => {
    onApplyTemplate(template);
    toast.success(`Applied ${template.name} template`);
  }, [onApplyTemplate]);

  const handleFavorite = useCallback((template: CoverPageTemplate) => {
    setFavorites(prev => {
      const isFavorited = prev.includes(template.id);
      if (isFavorited) {
        toast.success('Removed from favorites');
        return prev.filter(id => id !== template.id);
      } else {
        toast.success('Added to favorites');
        return [...prev, template.id];
      }
    });
  }, []);

  const categories = useMemo(() => 
    Array.from(new Set(BUILT_IN_TEMPLATES.map(t => t.category))),
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Template Library</h2>
          <p className="text-muted-foreground">
            Choose from {BUILT_IN_TEMPLATES.length} professionally designed templates
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredTemplates.length} of {BUILT_IN_TEMPLATES.length} templates
      </div>

      {/* Templates Grid/List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="favorites">Favorites ({favorites.length})</TabsTrigger>
          <TabsTrigger value="recent">Recently Used</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate?.id === template.id}
                  onSelect={setSelectedTemplate}
                  onApply={handleApplyTemplate}
                  onFavorite={handleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTemplates.map(template => (
                <Card key={template.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-24 h-16 rounded-md flex items-center justify-center text-white text-xs font-medium"
                      style={{ background: template.config.background }}
                    >
                      {template.name}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{template.name}</h3>
                        <div className="flex items-center gap-2">
                          {template.is_premium && (
                            <Badge variant="secondary">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Pro
                            </Badge>
                          )}
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {template.rating}
                          </span>
                          <span className="text-muted-foreground">
                            {template.usage_count} uses
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleFavorite(template)}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleApplyTemplate(template)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates
              .filter(template => favorites.includes(template.id))
              .map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate?.id === template.id}
                  onSelect={setSelectedTemplate}
                  onApply={handleApplyTemplate}
                  onFavorite={handleFavorite}
                />
              ))}
          </div>
          
          {favorites.length === 0 && (
            <div className="text-center py-12">
              <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
              <p className="text-muted-foreground">
                Click the star icon on any template to add it to your favorites
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent">
          <div className="text-center py-12">
            <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Recently Used</h3>
            <p className="text-muted-foreground">
              Templates you've used recently will appear here
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Template Details */}
      {selectedTemplate && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedTemplate.name}</span>
              <Button onClick={() => handleApplyTemplate(selectedTemplate)}>
                <Download className="w-4 h-4 mr-2" />
                Apply Template
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Details</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Category:</dt>
                    <dd className="capitalize">{selectedTemplate.category}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Difficulty:</dt>
                    <dd className="capitalize">{selectedTemplate.difficulty}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Rating:</dt>
                    <dd>{selectedTemplate.rating}/5</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Uses:</dt>
                    <dd>{selectedTemplate.usage_count}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Color Palette</h4>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(selectedTemplate.config.colors).map(([name, color]) => (
                    <div key={name} className="text-center">
                      <div 
                        className="w-12 h-12 rounded-md mx-auto mb-1"
                        style={{ backgroundColor: color }}
                      />
                      <p className="text-xs text-muted-foreground capitalize">{name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};