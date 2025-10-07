import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Clock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ItineraryViewProps {
  onBack: () => void;
}

const ItineraryView: React.FC<ItineraryViewProps> = ({ onBack }) => {
  const itineraryItems = [
    {
      id: '1',
      time: '10:00 AM',
      title: 'Boat Rental - Lake Austin',
      description: 'Premium pontoon boat for 4 hours',
      location: 'Lake Austin Marina',
      status: 'confirmed',
      type: 'activity'
    },
    {
      id: '2',
      time: '2:30 PM',
      title: 'Lunch at The Oasis',
      description: 'Sunset Capital of Texas',
      location: '6550 Comanche Trail',
      status: 'confirmed',
      type: 'dining'
    },
    {
      id: '3',
      time: '6:00 PM',
      title: 'Premium Whiskey Delivery',
      description: "Tito's Handmade Vodka delivery",
      location: 'Hotel Delivery',
      status: 'pending',
      type: 'delivery'
    },
    {
      id: '4',
      time: '8:00 PM',
      title: 'Live Music at The Continental Club',
      description: "Austin's legendary music venue",
      location: '1315 S Congress Ave',
      status: 'confirmed',
      type: 'entertainment'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'activity':
        return '🚤';
      case 'dining':
        return '🍽️';
      case 'delivery':
        return '🚚';
      case 'entertainment':
        return '🎵';
      default:
        return '📍';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 p-6 pb-24">
      <div className="max-w-4xl mx-auto">
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
            <h1 className="text-3xl font-bold text-white drop-shadow-2xl">My Itinerary</h1>
            <p className="text-white/90 drop-shadow-lg">Today's planned activities</p>
          </div>
        </motion.div>

        {/* Date Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-white">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Today - March 15, 2024</span>
                </div>
                <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/20">
                  Change Date
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Itinerary Timeline */}
        <div className="space-y-4">
          {itineraryItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="text-2xl mr-3">{getTypeIcon(item.type)}</div>
                        <div className="flex items-center text-white/80">
                          <Clock className="w-4 h-4 mr-1" />
                          <span className="font-semibold">{item.time}</span>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`ml-3 ${getStatusColor(item.status)} text-white border-0`}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                      <p className="text-white/70 mb-3">{item.description}</p>
                      
                      <div className="flex items-center text-white/60">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{item.location}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/20">
                        Details
                      </Button>
                      {item.status === 'pending' && (
                        <Button variant="secondary" size="sm">
                          Confirm
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Add New Item */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20 border-dashed hover:bg-white/15 transition-all duration-300 cursor-pointer">
            <CardContent className="p-8">
              <div className="text-white/60 mb-4">
                <Calendar className="w-8 h-8 mx-auto mb-2" />
                <p>Want to add something to your itinerary?</p>
              </div>
              <Button variant="secondary">
                Add New Activity
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ItineraryView;
