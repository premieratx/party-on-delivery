import { create } from 'zustand';

export interface ItineraryItem {
  id: string;
  type: 'boat' | 'transport' | 'delivery' | 'activity';
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  meta?: Record<string, any>;
}

export interface DeliveryItem {
  id: string;
  sku: string;
  name: string;
  category: 'Liquor' | 'Beer' | 'Wine' | 'Seltzers' | 'Cocktails' | 'Party supplies';
  price: number;
  image: string;
  variants?: { label: string; price: number }[];
  quantity?: number;
}

export interface BoatReservation {
  id: string;
  capacity: 14 | 25 | 30 | 50 | 75;
  date: string;
  slot: '12-4' | '4:30-8:30' | '11-3' | '3:30-7:30';
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface TransportRequest {
  id: string;
  people: number;
  dateTime: string;
  pickupAddress: string;
  dropoffAddress: string;
  vehicleSize: 14 | 25 | 30 | 50 | 75;
  hourlyRate: number;
  estHours: number;
  status: 'requested' | 'quoted' | 'scheduled';
}

interface AppState {
  showIntro: boolean;
  cart: DeliveryItem[];
  itinerary: ItineraryItem[];
  currentBooking: {
    boat?: Partial<BoatReservation>;
    transport?: Partial<TransportRequest>;
  };

  // Actions
  setShowIntro: (show: boolean) => void;
  addToCart: (item: DeliveryItem) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  addToItinerary: (item: ItineraryItem) => void;
  removeFromItinerary: (id: string) => void;
  setCurrentBooking: (type: 'boat' | 'transport', data: any) => void;
  clearCurrentBooking: (type: 'boat' | 'transport') => void;
}

export const useAppStore = create<AppState>((set) => ({
  showIntro: true,
  cart: [],
  itinerary: [],
  currentBooking: {},

  setShowIntro: (show) => set({ showIntro: show }),

  addToCart: (item) => set((state) => {
    const existingItem = state.cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      return {
        cart: state.cart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: (cartItem.quantity || 1) + (item.quantity || 1) }
            : cartItem
        )
      };
    }
    return { cart: [...state.cart, { ...item, quantity: item.quantity || 1 }] };
  }),

  removeFromCart: (id) => set((state) => ({
    cart: state.cart.filter(item => item.id !== id)
  })),

  updateCartQuantity: (id, quantity) => set((state) => ({
    cart: quantity <= 0
      ? state.cart.filter(item => item.id !== id)
      : state.cart.map(item => item.id === id ? { ...item, quantity } : item)
  })),

  clearCart: () => set({ cart: [] }),

  addToItinerary: (item) => set((state) => ({
    itinerary: [...state.itinerary, item]
  })),

  removeFromItinerary: (id) => set((state) => ({
    itinerary: state.itinerary.filter(item => item.id !== id)
  })),

  setCurrentBooking: (type, data) => set((state) => ({
    currentBooking: {
      ...state.currentBooking,
      [type]: { ...state.currentBooking[type], ...data }
    }
  })),

  clearCurrentBooking: (type) => set((state) => ({
    currentBooking: {
      ...state.currentBooking,
      [type]: undefined
    }
  })),
}));
