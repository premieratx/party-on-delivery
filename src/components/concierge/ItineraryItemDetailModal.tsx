import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar as CalendarIcon, MapPin, Users, DollarSign } from 'lucide-react';

interface ItineraryItemDetailModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ItineraryItemDetailModal({ item, isOpen, onClose }: ItineraryItemDetailModalProps) {
  if (!item) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'saved':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      default:
        return 'Saved';
    }
  };

  const status = item.meta?.status || 'saved';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-pink-800/95 backdrop-blur-xl border-white/20 text-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl font-bold text-white pr-8">
              {item.title}
            </DialogTitle>
            <Badge className={`${getStatusColor(status)} text-white border-0`}>
              {getStatusLabel(status)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Image */}
          {item.imageUrl && (
            <div className="aspect-video bg-white/10 rounded-lg overflow-hidden">
              <img 
                src={item.imageUrl} 
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Description */}
          {item.meta?.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Details</h3>
              <p className="text-white/80 leading-relaxed">{item.meta.description}</p>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 bg-white/5 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CalendarIcon className="w-5 h-5 mt-1 text-white/70" />
              <div>
                <p className="text-xs text-white/60">Date</p>
                <p className="font-semibold">{item.date}</p>
                {item.startTime && (
                  <p className="text-sm text-white/80">{item.startTime}</p>
                )}
              </div>
            </div>

            {item.meta?.duration && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 mt-1 text-white/70" />
                <div>
                  <p className="text-xs text-white/60">Duration</p>
                  <p className="font-semibold">{item.meta.duration}</p>
                </div>
              </div>
            )}

            {item.meta?.numberOfPeople && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 mt-1 text-white/70" />
                <div>
                  <p className="text-xs text-white/60">People</p>
                  <p className="font-semibold">{item.meta.numberOfPeople}</p>
                </div>
              </div>
            )}

            {item.meta?.capacity && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 mt-1 text-white/70" />
                <div>
                  <p className="text-xs text-white/60">Capacity</p>
                  <p className="font-semibold">{item.meta.capacity}</p>
                </div>
              </div>
            )}

            {item.meta?.price && (
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 mt-1 text-white/70" />
                <div>
                  <p className="text-xs text-white/60">Price</p>
                  <p className="font-semibold">${item.meta.price}</p>
                </div>
              </div>
            )}

            {item.meta?.pickupAddress && (
              <div className="flex items-start gap-3 col-span-2">
                <MapPin className="w-5 h-5 mt-1 text-white/70" />
                <div>
                  <p className="text-xs text-white/60">Pickup Location</p>
                  <p className="font-semibold">{item.meta.pickupAddress}</p>
                </div>
              </div>
            )}
          </div>

          {/* Features/Highlights */}
          {item.meta?.features && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Features</h3>
              <div className="grid grid-cols-2 gap-2">
                {item.meta.features.map((feature: string, idx: number) => (
                  <div key={idx} className="flex items-center bg-white/5 rounded-lg p-2">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-white/80 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special Requests */}
          {item.meta?.specialRequests && (
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-2 text-white/80">Special Requests</h3>
              <p className="text-white/70">{item.meta.specialRequests}</p>
            </div>
          )}

          {/* Status Info */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
              <h3 className="text-sm font-semibold">Status: {getStatusLabel(status)}</h3>
            </div>
            <p className="text-xs text-white/70">
              {status === 'confirmed' && 'Your booking has been confirmed!'}
              {status === 'pending' && 'Your booking request is being processed.'}
              {status === 'saved' && 'This item is saved to your itinerary. Book it to confirm!'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
