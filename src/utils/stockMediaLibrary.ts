// Stock media library with curated backgrounds for cover pages
export interface StockMedia {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'gif';
  category: string;
  tags: string[];
  thumbnail?: string;
}

export const stockMediaLibrary: StockMedia[] = [
  // Business & Professional
  {
    id: 'business-1',
    name: 'Modern Office',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop',
    type: 'image',
    category: 'business',
    tags: ['office', 'professional', 'modern', 'clean']
  },
  {
    id: 'business-2',
    name: 'City Skyline',
    url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920&h=1080&fit=crop',
    type: 'image',
    category: 'business',
    tags: ['city', 'skyline', 'urban', 'professional']
  },
  
  // Food & Beverage
  {
    id: 'food-1',
    name: 'Restaurant Interior',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop',
    type: 'image',
    category: 'food',
    tags: ['restaurant', 'dining', 'interior', 'elegant']
  },
  {
    id: 'food-2',
    name: 'Bar Setup',
    url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1920&h=1080&fit=crop',
    type: 'image',
    category: 'food',
    tags: ['bar', 'drinks', 'alcohol', 'nightlife']
  },
  {
    id: 'food-3',
    name: 'Kitchen Prep',
    url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&h=1080&fit=crop',
    type: 'image',
    category: 'food',
    tags: ['kitchen', 'cooking', 'fresh', 'ingredients']
  },
  
  // Lifestyle & Events
  {
    id: 'lifestyle-1',
    name: 'Party Celebration',
    url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1920&h=1080&fit=crop',
    type: 'image',
    category: 'lifestyle',
    tags: ['party', 'celebration', 'fun', 'social']
  },
  {
    id: 'lifestyle-2',
    name: 'Wedding Reception',
    url: 'https://images.unsplash.com/photo-1519167758481-83f29c8eb7c4?w=1920&h=1080&fit=crop',
    type: 'image',
    category: 'lifestyle',
    tags: ['wedding', 'elegant', 'reception', 'celebration']
  },
  {
    id: 'lifestyle-3',
    name: 'Lake House',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
    type: 'image',
    category: 'lifestyle',
    tags: ['lake', 'vacation', 'relaxing', 'nature']
  },
  
  // Abstract & Gradient
  {
    id: 'abstract-1',
    name: 'Blue Gradient',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&h=1080&fit=crop',
    type: 'image',
    category: 'abstract',
    tags: ['gradient', 'blue', 'modern', 'clean']
  },
  {
    id: 'abstract-2',
    name: 'Purple Waves',
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=1080&fit=crop',
    type: 'image',
    category: 'abstract',
    tags: ['purple', 'waves', 'fluid', 'modern']
  },
  {
    id: 'abstract-3',
    name: 'Golden Bokeh',
    url: 'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=1920&h=1080&fit=crop',
    type: 'image',
    category: 'abstract',
    tags: ['gold', 'bokeh', 'luxury', 'warm']
  },
  
  // Videos (using free video sources)
  {
    id: 'video-1',
    name: 'Cocktail Making',
    url: '/videos/whiskey-pour-17370-360.mp4',
    type: 'video',
    category: 'food',
    tags: ['cocktail', 'bartender', 'drinks', 'professional'],
    thumbnail: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop'
  },
  {
    id: 'video-2',
    name: 'Ice Drop',
    url: '/videos/whiskey-over-ice-5143-360.mp4',
    type: 'video',
    category: 'food',
    tags: ['ice', 'drink', 'refreshing', 'cool'],
    thumbnail: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=300&fit=crop'
  },
  
  // Animated GIFs (using CSS animations for now)
  {
    id: 'gif-1',
    name: 'Disco Ball',
    url: '/src/assets/disco-ball.gif',
    type: 'gif',
    category: 'lifestyle',
    tags: ['party', 'disco', 'celebration', 'fun'],
    thumbnail: 'https://images.unsplash.com/photo-1571243227558-bf038c0a0d15?w=400&h=300&fit=crop'
  }
];

export const getMediaByCategory = (category: string): StockMedia[] => {
  return stockMediaLibrary.filter(media => media.category === category);
};

export const getMediaByTag = (tag: string): StockMedia[] => {
  return stockMediaLibrary.filter(media => media.tags.includes(tag));
};

export const getAllCategories = (): string[] => {
  return [...new Set(stockMediaLibrary.map(media => media.category))];
};

export const getAllTags = (): string[] => {
  return [...new Set(stockMediaLibrary.flatMap(media => media.tags))];
};