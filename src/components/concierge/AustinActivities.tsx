import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Music, Camera, Utensils, Mountain, Eye } from 'lucide-react';
import { ActivityDetailModal } from './ActivityDetailModal';
import liveMusicImg from '@/assets/activities/live-music-tour.jpg';
import foodTruckImg from '@/assets/activities/food-truck-crawl.jpg';
import kayakImg from '@/assets/activities/kayak-adventure.jpg';
import muralImg from '@/assets/activities/mural-art-tour.jpg';
import bbqImg from '@/assets/activities/bbq-masterclass.jpg';
import batImg from '@/assets/activities/bat-watching.jpg';
import breweryImg from '@/assets/activities/brewery-hopping.jpg';
import hillCountryImg from '@/assets/activities/hill-country.jpg';

interface AustinActivitiesProps {
  onBack: () => void;
}

const AustinActivities: React.FC<AustinActivitiesProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      description: "Experience Austin's legendary music scene with visits to iconic venues including The Continental Club, Antone's, and the vibrant Red River District. Led by a local musician who will share insider stories and history.",
      category: 'music',
      duration: '4 hours',
      price: 85,
      rating: 4.9,
      participants: '2-8 people',
      highlights: ['The Continental Club', "Antone's", 'Red River District', 'Local musician guide'],
      availability: 'Tonight at 7 PM',
      imageUrl: liveMusicImg
    },
    {
      id: 'food-truck-crawl',
      title: 'Austin Food Truck Crawl',
      description: "Taste the best of Austin's diverse food truck scene with stops at 5 carefully selected trucks featuring local favorites, from tacos to BBQ to innovative fusion cuisine.",
      category: 'food',
      duration: '3 hours',
      price: 65,
      rating: 4.8,
      participants: '2-12 people',
      highlights: ['5 food truck stops', 'Local favorites', 'Vegetarian options', 'Food guide'],
      availability: 'Daily at 11 AM & 6 PM',
      imageUrl: foodTruckImg
    },
    {
      id: 'kayak-adventure',
      title: 'Lady Bird Lake Kayak Adventure',
      description: 'Paddle through downtown Austin with stunning skyline views. Perfect for beginners and experienced kayakers alike. All equipment and safety gear included.',
      category: 'outdoor',
      duration: '2.5 hours',
      price: 75,
      rating: 4.7,
      participants: '1-8 people',
      highlights: ['Kayak rental included', 'Guided tour', 'Skyline photography', 'Safety equipment'],
      availability: 'Multiple times daily',
      imageUrl: kayakImg
    },
    {
      id: 'mural-art-tour',
      title: 'Austin Street Art & Mural Tour',
      description: "Discover Austin's vibrant street art scene with visits to famous murals and hidden artistic gems. Learn about the artists and stories behind each piece.",
      category: 'culture',
      duration: '2 hours',
      price: 45,
      rating: 4.6,
      participants: '2-15 people',
      highlights: ['Famous murals', 'Artist stories', 'Photo opportunities', 'Art history'],
      availability: 'Daily at 10 AM & 3 PM',
      imageUrl: muralImg
    },
    {
      id: 'bbq-masterclass',
      title: 'Texas BBQ Masterclass',
      description: 'Learn the secrets of authentic Texas BBQ from local pitmasters. Hands-on experience with meat selection, rub preparation, and low-and-slow smoking techniques.',
      category: 'food',
      duration: '4 hours',
      price: 120,
      rating: 4.9,
      participants: '6-12 people',
      highlights: ['Hands-on cooking', 'Meat selection', 'Smoking techniques', 'Full meal included'],
      availability: 'Weekends only',
      imageUrl: bbqImg
    },
    {
      id: 'bat-watching',
      title: 'Congress Bridge Bat Watching',
      description: "Witness the spectacular nightly emergence of over 1.5 million Mexican free-tailed bats from under Congress Bridge. A truly unique Austin experience.",
      category: 'outdoor',
      duration: '1.5 hours',
      price: 35,
      rating: 4.5,
      participants: '2-20 people',
      highlights: ['Best viewing spots', 'Bat facts', 'Sunset viewing', 'Photography tips'],
      availability: 'Every evening at sunset',
      imageUrl: batImg
    },
    {
      id: 'brewery-hopping',
      title: 'Craft Brewery Hopping Tour',
      description: "Sample Austin's best craft beers with stops at 4 local breweries. Transportation included between locations. Perfect for beer enthusiasts.",
      category: 'food',
      duration: '4 hours',
      price: 95,
      rating: 4.8,
      participants: '4-10 people',
      highlights: ['4 brewery stops', 'Transportation included', 'Beer tastings', 'Local beer expert'],
      availability: 'Friday-Sunday',
      imageUrl: breweryImg
    },
    {
      id: 'hill-country-day-trip',
      title: 'Texas Hill Country Day Trip',
      description: 'Scenic drive through rolling hills, visiting wineries and charming historic towns. Includes wine tastings, lunch, and photo stops at breathtaking viewpoints.',
      category: 'outdoor',
      duration: '8 hours',
      price: 180,
      rating: 4.9,
      participants: '2-6 people',
      highlights: ['Wine tastings', 'Scenic drives', 'Historic towns', 'Lunch included'],
      availability: 'Daily departures',
      imageUrl: hillCountryImg
    }
  ];

  const filteredActivities = selectedCategory === 'all' 
    ? activities 
    : activities.filter(activity => activity.category === selectedCategory);

  const handleViewDetails = (activity: any) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 p-6 pb-32">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-8"
        >
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

        {/* Activities Grid - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 h-full">
                <CardHeader className="p-4">
                  {/* Image */}
                  <div className="aspect-[16/9] bg-white/20 rounded-lg mb-4 overflow-hidden">
                    <img 
                      src={activity.imageUrl} 
                      alt={activity.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex flex-col">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-4">{activity.title}</h3>
                  
                  {/* Price */}
                  <div className="text-white mb-4">
                    <span className="text-sm text-white/70">From</span>
                    <p className="font-bold text-2xl">${activity.price}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto">
                    <Button 
                      variant="secondary"
                      className="flex-1 bg-white/20 text-white hover:bg-white/30"
                      onClick={() => handleViewDetails(activity)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default AustinActivities;
