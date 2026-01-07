import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Clock, Calendar, Trash2, Share2, Copy, Check, Plane, PlaneLanding } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ItineraryItemDetailModal } from './ItineraryItemDetailModal';
import { TripDatesModal } from './TripDatesModal';
import { format } from 'date-fns';

interface ItineraryViewProps {
  onBack: () => void;
}

interface TripDates {
  arrivalDate: Date;
  arrivalTime: string;
  departureDate: Date;
  departureTime: string;
}

const ItineraryView: React.FC<ItineraryViewProps> = ({ onBack }) => {
  const itinerary = useAppStore((state) => state.itinerary);
  const removeFromItinerary = useAppStore((state) => state.removeFromItinerary);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDatesModalOpen, setIsDatesModalOpen] = useState(false);
  const [tripDates, setTripDates] = useState<TripDates | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load trip dates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tripDates');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTripDates({
        ...parsed,
        arrivalDate: new Date(parsed.arrivalDate),
        departureDate: new Date(parsed.departureDate),
      });
    }
  }, []);

  const handleSaveTripDates = (dates: TripDates) => {
    setTripDates(dates);
    localStorage.setItem('tripDates', JSON.stringify(dates));
    toast({
      title: "Trip dates saved!",
      description: `${format(dates.arrivalDate, 'MMM d')} - ${format(dates.departureDate, 'MMM d, yyyy')}`,
    });
  };

  const handleRemove = (id: string, title: string) => {
    removeFromItinerary(id);
    toast({
      title: "Removed from itinerary",
      description: `${title} has been removed from your itinerary.`,
    });
  };

  const handlePublishLink = () => {
    // Generate a shareable link (in production, this would save to backend)
    const shareId = btoa(JSON.stringify({ tripDates, itinerary, timestamp: Date.now() })).slice(0, 20);
    const link = `${window.location.origin}/shared-itinerary/${shareId}`;
    setShareLink(link);
  };

  const handleCopyLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with your group.",
      });
      setTimeout(() => setCopied(false), 2000);
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

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 p-6 pb-24">
      <div className="max-w-4xl mx-auto">
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
              <h1 className="text-3xl font-bold text-white drop-shadow-2xl">My Itinerary</h1>
              <p className="text-white/90 drop-shadow-lg">Plan your Austin adventure</p>
            </div>
          </div>
          <Button
            onClick={handlePublishLink}
            className="bg-white/20 text-white hover:bg-white/30"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </motion.div>

        {/* Share Link Section */}
        {shareLink && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-green-500/20 backdrop-blur-md border-green-400/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold mb-1">Share with your group:</p>
                    <p className="text-white/80 text-sm truncate">{shareLink}</p>
                  </div>
                  <Button
                    onClick={handleCopyLink}
                    className={copied ? "bg-green-500 hover:bg-green-600" : "bg-white/20 hover:bg-white/30"}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Trip Dates Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              {tripDates ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-white">
                      <Plane className="w-5 h-5 mr-2 text-green-400" />
                      <div>
                        <span className="text-sm text-white/70">Arrival</span>
                        <p className="font-semibold">{format(tripDates.arrivalDate, 'EEE, MMM d')} at {tripDates.arrivalTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-white text-right">
                      <div>
                        <span className="text-sm text-white/70">Departure</span>
                        <p className="font-semibold">{format(tripDates.departureDate, 'EEE, MMM d')} at {tripDates.departureTime}</p>
                      </div>
                      <PlaneLanding className="w-5 h-5 ml-2 text-red-400" />
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full bg-white/20 text-white hover:bg-white/30"
                    onClick={() => setIsDatesModalOpen(true)}
                  >
                    Edit Trip Dates
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-white">
                    <Calendar className="w-5 h-5 mr-2" />
                    <span className="font-semibold">Set your trip dates</span>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="bg-yellow-500 text-black hover:bg-yellow-600 font-bold"
                    onClick={() => setIsDatesModalOpen(true)}
                  >
                    Add Dates
                  </Button>
                </div>
              )}
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
              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer"
                onClick={() => handleViewDetails(item)}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {item.imageUrl && (
                      <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-2">
                        <div className="text-2xl mr-3">{getTypeIcon(item.type)}</div>
                        <div className="flex items-center text-white/80">
                          <Clock className="w-4 h-4 mr-1" />
                          <span className="font-semibold">{item.startTime || item.date}</span>
                          {item.endTime && <span className="ml-1">- {item.endTime}</span>}
                        </div>
                        <Badge
                          variant="secondary"
                          className={`ml-3 ${getStatusColor(item.meta?.status || 'saved')} text-white border-0`}
                        >
                          {getStatusLabel(item.meta?.status || 'saved')}
                        </Badge>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                      {item.meta?.description && (
                        <p className="text-white/70 mb-3 line-clamp-2">{item.meta.description}</p>
                      )}
                      
                      {item.meta?.duration && (
                        <div className="flex items-center text-white/60 mb-2">
                          <Clock className="w-4 h-4 mr-1" />
                          <span className="text-sm">{item.meta.duration}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="bg-white/20 text-white hover:bg-white/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(item.id, item.title);
                        }}
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
              <Button variant="secondary" onClick={() => navigate('/explore')}>
                Add New Activity
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modals */}
      <ItineraryItemDetailModal
        item={selectedItem}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
      <TripDatesModal
        isOpen={isDatesModalOpen}
        onClose={() => setIsDatesModalOpen(false)}
        onSave={handleSaveTripDates}
        initialDates={tripDates || undefined}
      />
    </div>
  );
};

export default ItineraryView;
