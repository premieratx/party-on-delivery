import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, Star, Calendar as CalendarIcon } from 'lucide-react';
import { BookingModal } from './BookingModal';
import { AddToItineraryButton } from './AddToItineraryButton';

interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  price: number;
  rating: number;
  participants: string;
  highlights: string[];
  availability: string;
  imageUrl?: string;
}

interface ActivityDetailModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityDetailModal({ activity, isOpen, onClose }: ActivityDetailModalProps) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  if (!activity) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) onClose();
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 border-white/20 text-white max-h-[85vh] overflow-y-auto z-[100]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center justify-between">
              {activity.title}
              <div className="flex items-center text-yellow-400">
                <Star className="w-5 h-5 mr-1 fill-yellow-400" />
                <span className="text-lg font-semibold">{activity.rating}</span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Category Badge */}
            <div>
              <Badge className="bg-white/20 text-white capitalize text-sm">
                {activity.category}
              </Badge>
            </div>

            {/* Main Image */}
            <div className="aspect-video bg-white/10 rounded-lg overflow-hidden">
              {activity.imageUrl ? (
                <img 
                  src={activity.imageUrl} 
                  alt={activity.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">📸</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">About This Experience</h3>
              <p className="text-white/80 leading-relaxed">{activity.description}</p>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 gap-4 bg-white/5 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-white/70" />
                <div>
                  <p className="text-xs text-white/60">Duration</p>
                  <p className="font-semibold">{activity.duration}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-white/70" />
                <div>
                  <p className="text-xs text-white/60">Group Size</p>
                  <p className="font-semibold">{activity.participants}</p>
                </div>
              </div>
              <div className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-white/70" />
                <div>
                  <p className="text-xs text-white/60">Availability</p>
                  <p className="font-semibold text-sm">{activity.availability}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-2">💰</span>
                <div>
                  <p className="text-xs text-white/60">Price</p>
                  <p className="font-semibold text-lg">${activity.price}</p>
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div>
              <h3 className="text-lg font-semibold mb-3">What's Included</h3>
              <ul className="space-y-2">
                {activity.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-green-400 mr-3 mt-1">✓</span>
                    <span className="text-white/80">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-white/10 flex gap-3">
              <Button
                variant="default"
                size="lg"
                className="flex-1 text-base py-6"
                onClick={() => setIsBookingModalOpen(true)}
              >
                <CalendarIcon className="w-5 h-5 mr-2" />
                Book This Activity
              </Button>
              <AddToItineraryButton
                item={{
                  type: 'activity',
                  title: activity.title,
                  date: new Date().toISOString().split('T')[0],
                  imageUrl: activity.imageUrl,
                  meta: {
                    description: activity.description,
                    duration: activity.duration,
                    price: activity.price,
                    category: activity.category
                  }
                }}
                variant="secondary"
                size="lg"
                className="flex-1 text-base py-6 bg-white/15 text-white hover:bg-white/25"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Modal - OUTSIDE the main Dialog */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        itemType="activity"
        itemTitle={activity.title}
        itemDetails={{
          description: activity.description,
          duration: activity.duration,
          price: activity.price,
          category: activity.category
        }}
      />
    </>
  );
}
