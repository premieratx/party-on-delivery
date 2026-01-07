import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Calendar, Trash2, Share2, Copy, Check, Plane, PlaneLanding, GripVertical, Edit2, AlertTriangle, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAppStore, ItineraryItem } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ItineraryItemDetailModal } from './ItineraryItemDetailModal';
import { TripDatesModal } from './TripDatesModal';
import { EditItineraryItemModal } from './EditItineraryItemModal';
import { format, parseISO } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ItineraryViewProps {
  onBack: () => void;
}

interface TripDates {
  arrivalDate: Date;
  arrivalTime: string;
  departureDate: Date;
  departureTime: string;
}

// Helper to convert time string to comparable number
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

// Helper to create sortable datetime from item
const getItemDateTime = (item: ItineraryItem): number => {
  const dateNum = item.date ? parseISO(item.date).getTime() : 0;
  const timeNum = timeToMinutes(item.startTime || '');
  return dateNum + timeNum * 60000; // Add minutes as milliseconds
};

// Sortable Item Component
function SortableItineraryItem({ 
  item, 
  onViewDetails, 
  onRemove,
  onEdit,
  getTypeIcon, 
  getStatusColor, 
  getStatusLabel,
  isOutOfOrder,
}: { 
  item: ItineraryItem; 
  onViewDetails: (item: ItineraryItem) => void;
  onRemove: (id: string, title: string) => void;
  onEdit: (item: ItineraryItem) => void;
  getTypeIcon: (type: string) => string;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  isOutOfOrder: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formattedDate = item.date ? format(parseISO(item.date), 'EEE, MMM d') : '';

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        className={`bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 ${isDragging ? 'shadow-2xl ring-2 ring-yellow-500/50' : ''} ${isOutOfOrder ? 'ring-2 ring-orange-500/70' : ''}`}
      >
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start gap-3 md:gap-4">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-2 -ml-2 touch-none"
            >
              <GripVertical className="w-5 h-5 text-white/50 hover:text-white" />
            </div>

            {/* Image */}
            {item.imageUrl && (
              <div 
                className="w-20 h-20 md:w-28 md:h-28 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                onClick={() => onViewDetails(item)}
              >
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              {/* Date/Time Row - Clickable to Edit */}
              <div 
                className="flex items-center flex-wrap gap-2 mb-2 cursor-pointer group"
                onClick={() => onEdit(item)}
              >
                <div className="text-xl md:text-2xl">{getTypeIcon(item.type)}</div>
                <div className="flex items-center text-white/80 bg-white/10 px-2 py-1 rounded group-hover:bg-white/20 transition-colors">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span className="font-semibold text-xs md:text-sm">{formattedDate}</span>
                </div>
                <div className="flex items-center text-white/80 bg-white/10 px-2 py-1 rounded group-hover:bg-white/20 transition-colors">
                  <Clock className="w-3 h-3 mr-1" />
                  <span className="font-semibold text-xs md:text-sm">
                    {item.startTime || 'No time'}
                    {item.endTime && ` - ${item.endTime}`}
                  </span>
                  <Edit2 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {isOutOfOrder && (
                  <div className="flex items-center text-orange-400 text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Out of order
                  </div>
                )}
                <Badge
                  variant="secondary"
                  className={`${getStatusColor(item.meta?.status || 'saved')} text-white border-0 text-xs`}
                >
                  {getStatusLabel(item.meta?.status || 'saved')}
                </Badge>
              </div>
              
              <h3 
                className="text-base md:text-lg font-semibold text-white mb-1 cursor-pointer hover:underline"
                onClick={() => onViewDetails(item)}
              >
                {item.title}
              </h3>
              {item.meta?.description && (
                <p className="text-white/70 line-clamp-1 text-xs md:text-sm">{item.meta.description}</p>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white/20 text-white hover:bg-white/30"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white/20 text-white hover:bg-white/30"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id, item.title);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const ItineraryView: React.FC<ItineraryViewProps> = ({ onBack }) => {
  const itinerary = useAppStore((state) => state.itinerary);
  const removeFromItinerary = useAppStore((state) => state.removeFromItinerary);
  const updateItineraryItem = useAppStore((state) => state.updateItineraryItem);
  const reorderItinerary = useAppStore((state) => state.reorderItinerary);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDatesModalOpen, setIsDatesModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tripDates, setTripDates] = useState<TripDates | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Check for out-of-order items
  const { outOfOrderIds, hasOutOfOrder } = useMemo(() => {
    if (itinerary.length < 2) return { outOfOrderIds: new Set<string>(), hasOutOfOrder: false };
    
    const outOfOrder = new Set<string>();
    const sorted = [...itinerary].sort((a, b) => getItemDateTime(a) - getItemDateTime(b));
    
    for (let i = 0; i < itinerary.length; i++) {
      if (itinerary[i].id !== sorted[i].id) {
        outOfOrder.add(itinerary[i].id);
      }
    }
    
    return { outOfOrderIds: outOfOrder, hasOutOfOrder: outOfOrder.size > 0 };
  }, [itinerary]);

  const handleAutoSort = () => {
    const sorted = [...itinerary].sort((a, b) => getItemDateTime(a) - getItemDateTime(b));
    reorderItinerary(sorted);
    toast({
      title: "Timeline adjusted!",
      description: "Items have been sorted chronologically.",
    });
  };

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = itinerary.findIndex((item) => item.id === active.id);
      const newIndex = itinerary.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(itinerary, oldIndex, newIndex);
      reorderItinerary(newOrder);
    }
  };

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

  const handleEditItem = (item: ItineraryItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveItemEdit = (updatedItem: ItineraryItem) => {
    updateItineraryItem(updatedItem);
    toast({
      title: "Updated!",
      description: `${updatedItem.title} has been updated.`,
    });
  };

  const handlePublishLink = () => {
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

  const handleViewDetails = (item: ItineraryItem) => {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 p-4 md:p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/20 mr-3"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-2xl">My Itinerary</h1>
              <p className="text-white/90 drop-shadow-lg text-sm">Plan your Austin adventure</p>
            </div>
          </div>
          <Button
            onClick={handlePublishLink}
            className="bg-white/20 text-white hover:bg-white/30"
            size="sm"
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
            className="mb-4"
          >
            <Card className="bg-green-500/20 backdrop-blur-md border-green-400/30">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold mb-1">Share with your group:</p>
                    <p className="text-white/80 text-xs truncate">{shareLink}</p>
                  </div>
                  <Button
                    onClick={handleCopyLink}
                    size="sm"
                    className={copied ? "bg-green-500 hover:bg-green-600" : "bg-white/20 hover:bg-white/30"}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Out of Order Warning */}
        {hasOutOfOrder && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Card className="bg-orange-500/20 backdrop-blur-md border-orange-400/30">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-white text-sm font-semibold">Items are out of chronological order</p>
                      <p className="text-white/70 text-xs">Some activities don't match the timeline</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleAutoSort}
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold"
                  >
                    <Wand2 className="w-4 h-4 mr-1" />
                    Auto-fix
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
          className="mb-4"
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              {tripDates ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-white">
                      <Plane className="w-5 h-5 mr-2 text-green-400" />
                      <div>
                        <span className="text-xs text-white/70">Arrival</span>
                        <p className="font-semibold text-sm">{format(tripDates.arrivalDate, 'EEE, MMM d')} at {tripDates.arrivalTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-white text-right">
                      <div>
                        <span className="text-xs text-white/70">Departure</span>
                        <p className="font-semibold text-sm">{format(tripDates.departureDate, 'EEE, MMM d')} at {tripDates.departureTime}</p>
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

        {/* Itinerary Timeline with Drag and Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={itinerary.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {itinerary.length === 0 ? (
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-12 text-center">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-white/40" />
                    <h3 className="text-xl font-semibold text-white mb-2">No activities yet</h3>
                    <p className="text-white/70">Start exploring and add activities to your itinerary!</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <p className="text-white/70 text-xs text-center mb-2">
                    <GripVertical className="w-3 h-3 inline mr-1" />
                    Drag to reorder • Tap date/time to edit
                  </p>
                  {itinerary.map((item) => (
                    <SortableItineraryItem
                      key={item.id}
                      item={item}
                      onViewDetails={handleViewDetails}
                      onRemove={handleRemove}
                      onEdit={handleEditItem}
                      getTypeIcon={getTypeIcon}
                      getStatusColor={getStatusColor}
                      getStatusLabel={getStatusLabel}
                      isOutOfOrder={outOfOrderIds.has(item.id)}
                    />
                  ))}
                </>
              )}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add New Item */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20 border-dashed hover:bg-white/15 transition-all duration-300 cursor-pointer">
            <CardContent className="p-6">
              <div className="text-white/60 mb-4">
                <Calendar className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Want to add something to your itinerary?</p>
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
      <EditItineraryItemModal
        item={editingItem}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveItemEdit}
        defaultDate={tripDates?.arrivalDate}
      />
    </div>
  );
};

export default ItineraryView;
