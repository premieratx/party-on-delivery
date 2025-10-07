import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Clock, Calendar, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';

interface ItineraryViewProps {
  onBack: () => void;
}

const ItineraryView: React.FC<ItineraryViewProps> = ({ onBack }) => {
  const itinerary = useAppStore((state) => state.itinerary);
  const removeFromItinerary = useAppStore((state) => state.removeFromItinerary);
  const { toast } = useToast();

  const handleRemove = (id: string, title: string) => {
    removeFromItinerary(id);
    toast({
      title: "Removed from itinerary",
      description: `${title} has been removed from your itinerary.`,
    });
  };

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
        return '🎯';
      case 'boat':
        return '🚤';
      case 'transport':
        return '🚗';
      case 'delivery':
        return '🚚';
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
          {itinerary.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-white/40" />
                <h3 className="text-xl font-semibold text-white mb-2">No activities yet</h3>
                <p className="text-white/70">Start exploring and add activities to your itinerary!</p>
              </CardContent>
            </Card>
          ) : (
            itinerary.map((item, index) => (
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
                          <span className="font-semibold">{item.startTime || item.date}</span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="ml-3 bg-green-500 text-white border-0"
                        >
                          planned
                        </Badge>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                      {item.meta?.description && (
                        <p className="text-white/70 mb-3">{item.meta.description}</p>
                      )}
                      
                      {item.meta?.duration && (
                        <div className="flex items-center text-white/60 mb-2">
                          <Clock className="w-4 h-4 mr-1" />
                          <span className="text-sm">{item.meta.duration}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-white/30 text-white hover:bg-white/20"
                        onClick={() => handleRemove(item.id, item.title)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
          )}
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
