import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Plane, PlaneLanding, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ItineraryItem } from '@/store/useAppStore';

interface TripDates {
  arrivalDate: string;
  arrivalTime: string;
  departureDate: string;
  departureTime: string;
}

interface SharedData {
  tripDates: TripDates | null;
  itinerary: ItineraryItem[];
  timestamp: number;
}

const SharedItineraryPage = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const [sharedData, setSharedData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shareId) {
      try {
        // Decode the base64 share ID
        const decoded = atob(shareId);
        const data = JSON.parse(decoded) as SharedData;
        setSharedData(data);
      } catch (e) {
        setError('Invalid or expired share link');
      }
    }
  }, [shareId]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'activity': return '🎯';
      case 'boat': return '🚤';
      case 'transport': return '🚗';
      case 'delivery': return '🚚';
      case 'rental': return '🏠';
      default: return '📍';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'saved': return 'bg-blue-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'pending': return 'Pending';
      default: return 'Saved';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 p-6 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-white/40" />
            <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <Button onClick={() => navigate('/')} className="bg-white/20 text-white hover:bg-white/30">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sharedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 p-6 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
          <p>Loading itinerary...</p>
        </div>
      </div>
    );
  }

  const { tripDates, itinerary } = sharedData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 p-4 md:p-6 pb-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20 mr-3"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-2xl">Shared Itinerary</h1>
            <p className="text-white/90 drop-shadow-lg text-sm">Austin Adventure Plan</p>
          </div>
        </motion.div>

        {/* Trip Dates */}
        {tripDates && (
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
                    <Plane className="w-5 h-5 mr-2 text-green-400" />
                    <div>
                      <span className="text-xs text-white/70">Arrival</span>
                      <p className="font-semibold text-sm">
                        {format(new Date(tripDates.arrivalDate), 'EEE, MMM d')} at {tripDates.arrivalTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-white text-right">
                    <div>
                      <span className="text-xs text-white/70">Departure</span>
                      <p className="font-semibold text-sm">
                        {format(new Date(tripDates.departureDate), 'EEE, MMM d')} at {tripDates.departureTime}
                      </p>
                    </div>
                    <PlaneLanding className="w-5 h-5 ml-2 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Itinerary Items */}
        <div className="space-y-3">
          {itinerary.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-white/40" />
                <h3 className="text-xl font-semibold text-white mb-2">No activities yet</h3>
                <p className="text-white/70">This itinerary is empty.</p>
              </CardContent>
            </Card>
          ) : (
            itinerary.map((item, index) => {
              const formattedDate = item.date ? format(parseISO(item.date), 'EEE, MMM d') : '';
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-start gap-3 md:gap-4">
                        {/* Image */}
                        {item.imageUrl && (
                          <div className="w-20 h-20 md:w-28 md:h-28 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          {/* Date/Time Row */}
                          <div className="flex items-center flex-wrap gap-2 mb-2">
                            <div className="text-xl md:text-2xl">{getTypeIcon(item.type)}</div>
                            <div className="flex items-center text-white/80 bg-white/10 px-2 py-1 rounded">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span className="font-semibold text-xs md:text-sm">{formattedDate}</span>
                            </div>
                            <div className="flex items-center text-white/80 bg-white/10 px-2 py-1 rounded">
                              <Clock className="w-3 h-3 mr-1" />
                              <span className="font-semibold text-xs md:text-sm">
                                {item.startTime || 'TBD'}
                                {item.endTime && ` - ${item.endTime}`}
                              </span>
                            </div>
                            <Badge
                              variant="secondary"
                              className={`${getStatusColor(item.meta?.status || 'saved')} text-white border-0 text-xs`}
                            >
                              {getStatusLabel(item.meta?.status || 'saved')}
                            </Badge>
                          </div>
                          
                          <h3 className="text-base md:text-lg font-semibold text-white mb-1">{item.title}</h3>
                          {item.meta?.description && (
                            <p className="text-white/70 line-clamp-2 text-xs md:text-sm">{item.meta.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-white/60 text-sm mb-4">Want to create your own itinerary?</p>
          <Button onClick={() => navigate('/')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
            Start Planning
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default SharedItineraryPage;
