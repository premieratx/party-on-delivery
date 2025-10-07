import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Clock, Star, Users, Calendar, Music, Camera, Utensils, Mountain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AddToItineraryButton } from './AddToItineraryButton';

interface AustinActivitiesProps {
  onBack: () => void;
}

const AustinActivities: React.FC<AustinActivitiesProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  const categories = [
    { id: 'all', label: 'All Activities', icon: MapPin },
    { id: 'music', label: 'Music & Entertainment', icon: Music },
    { id: 'food', label: 'Food & Drink', icon: Utensils },
    { id: 'outdoor', label: 'Outdoor Adventures', icon: Mountain },
    { id: 'culture', label: 'Arts & Culture', icon: Camera }
  ];

  const activities = [
    {
      id: 'live-music-tour',
      title: 'Live Music Venue Tour',
      description: "Experience Austin's legendary music scene with visits to iconic venues",
      category: 'music',
      duration: '4 hours',
      price: 85,
      rating: 4.9,
      participants: '2-8 people',
      highlights: ['The Continental Club', "Antone's", 'Red River District', 'Local musician guide'],
      availability: 'Tonight at 7 PM'
    },
    {
      id: 'food-truck-crawl',
      title: 'Austin Food Truck Crawl',
      description: "Taste the best of Austin's diverse food truck scene",
      category: 'food',
      duration: '3 hours',
      price: 65,
      rating: 4.8,
      participants: '2-12 people',
      highlights: ['5 food truck stops', 'Local favorites', 'Vegetarian options', 'Food guide'],
      availability: 'Daily at 11 AM & 6 PM'
    },
    {
      id: 'kayak-adventure',
      title: 'Lady Bird Lake Kayak Adventure',
      description: 'Paddle through downtown Austin with stunning skyline views',
      category: 'outdoor',
      duration: '2.5 hours',
      price: 75,
      rating: 4.7,
      participants: '1-8 people',
      highlights: ['Kayak rental included', 'Guided tour', 'Skyline photography', 'Safety equipment'],
      availability: 'Multiple times daily'
    },
    {
      id: 'mural-art-tour',
      title: 'Austin Street Art & Mural Tour',
      description: "Discover Austin's vibrant street art and learn about local artists",
      category: 'culture',
      duration: '2 hours',
      price: 45,
      rating: 4.6,
      participants: '2-15 people',
      highlights: ['Famous murals', 'Artist stories', 'Photo opportunities', 'Art history'],
      availability: 'Daily at 10 AM & 3 PM'
    },
    {
      id: 'bbq-masterclass',
      title: 'Texas BBQ Masterclass',
      description: 'Learn the secrets of authentic Texas BBQ from local pitmasters',
      category: 'food',
      duration: '4 hours',
      price: 120,
      rating: 4.9,
      participants: '6-12 people',
      highlights: ['Hands-on cooking', 'Meat selection', 'Smoking techniques', 'Full meal included'],
      availability: 'Weekends only'
    },
    {
      id: 'bat-watching',
      title: 'Congress Bridge Bat Watching',
      description: "Witness the spectacular nightly emergence of Austin's famous bats",
      category: 'outdoor',
      duration: '1.5 hours',
      price: 35,
      rating: 4.5,
      participants: '2-20 people',
      highlights: ['Best viewing spots', 'Bat facts', 'Sunset viewing', 'Photography tips'],
      availability: 'Every evening at sunset'
    },
    {
      id: 'brewery-hopping',
      title: 'Craft Brewery Hopping Tour',
      description: "Sample Austin's best craft beers with transportation included",
      category: 'food',
      duration: '4 hours',
      price: 95,
      rating: 4.8,
      participants: '4-10 people',
      highlights: ['4 brewery stops', 'Transportation included', 'Beer tastings', 'Local beer expert'],
      availability: 'Friday-Sunday'
    },
    {
      id: 'hill-country-day-trip',
      title: 'Texas Hill Country Day Trip',
      description: 'Scenic drive through rolling hills, wineries, and charming towns',
      category: 'outdoor',
      duration: '8 hours',
      price: 180,
      rating: 4.9,
      participants: '2-6 people',
      highlights: ['Wine tastings', 'Scenic drives', 'Historic towns', 'Lunch included'],
      availability: 'Daily departures'
    }
  ];

  const filteredActivities = selectedCategory === 'all' 
    ? activities 
    : activities.filter(activity => activity.category === selectedCategory);

  const toggleActivitySelection = (activityId: string) => {
    setSelectedActivities(prev => 
      prev.includes(activityId) 
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const getTotalPrice = () => {
    return selectedActivities.reduce((total, activityId) => {
      const activity = activities.find(a => a.id === activityId);
      return total + (activity ? activity.price : 0);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 p-6 pb-32">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/20 mr-4"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-2xl">Austin Activities</h1>
              <p className="text-white/90 drop-shadow-lg">Discover the best experiences Austin has to offer</p>
            </div>
          </div>
          
          {selectedActivities.length > 0 && (
            <div className="text-white">
              <Badge variant="secondary" className="mr-3 bg-white/20 text-white">
                {selectedActivities.length} selected
              </Badge>
              <span className="font-bold">${getTotalPrice()}</span>
            </div>
          )}
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "secondary"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id ? "" : "bg-white/20 text-white hover:bg-white/30 border-0"}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {category.label}
                </Button>
              );
            })}
          </div>
        </motion.div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <Card className={`bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer ${
                selectedActivities.includes(activity.id) ? 'border-white/40 bg-white/20' : ''
              }`}>
                <CardHeader className="p-4">
                  <div className="aspect-[4/3] bg-white/20 rounded-lg mb-3 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-white/60" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs capitalize bg-white/20 text-white">
                      {activity.category}
                    </Badge>
                    <div className="flex items-center text-yellow-400">
                      <Star className="w-4 h-4 mr-1" />
                      <span className="text-sm font-semibold">{activity.rating}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <h3 className="text-white font-semibold text-lg mb-2">{activity.title}</h3>
                  <p className="text-white/70 text-sm mb-3">{activity.description}</p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center text-white/80">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="text-sm">{activity.duration}</span>
                    </div>
                    <div className="flex items-center text-white/80">
                      <Users className="w-4 h-4 mr-2" />
                      <span className="text-sm">{activity.participants}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-white/80 text-sm font-semibold mb-2">Highlights:</h4>
                    <div className="space-y-1">
                      {activity.highlights.slice(0, 3).map((highlight, idx) => (
                        <div key={idx} className="flex items-center text-white/70 text-xs">
                          <span className="w-1 h-1 bg-white/50 rounded-full mr-2"></span>
                          {highlight}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-white">
                      <span className="text-sm text-white/70">From</span>
                      <p className="font-bold text-lg">${activity.price}</p>
                    </div>
                    <div className="text-white/70 text-xs text-right">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {activity.availability}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <AddToItineraryButton
                      item={{
                        type: 'activity',
                        title: activity.title,
                        date: new Date().toISOString().split('T')[0],
                        startTime: activity.availability,
                        meta: {
                          description: activity.description,
                          duration: activity.duration,
                          price: activity.price,
                          category: activity.category
                        }
                      }}
                      variant="secondary"
                      className="flex-1"
                    />
                    <Button variant="secondary" size="sm" className="bg-white/20 text-white hover:bg-white/30">
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Selection Summary */}
        {selectedActivities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-20 left-4 right-4 max-w-6xl mx-auto z-10"
          >
            <Card className="bg-white/20 backdrop-blur-md border-white/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <span className="font-semibold">{selectedActivities.length} activities selected</span>
                    <span className="text-white/70 ml-2">Total: ${getTotalPrice()}</span>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setSelectedActivities([])} className="bg-white/20 text-white hover:bg-white/30">
                      Clear All
                    </Button>
                    <Button variant="default" size="lg">
                      Book Selected
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AustinActivities;
