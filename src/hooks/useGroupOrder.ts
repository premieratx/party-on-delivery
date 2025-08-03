import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GroupOrderParticipant {
  email: string;
  name: string;
  items: any[];
  subtotal: number;
  joined_at: string;
}

interface UseGroupOrderReturn {
  groupToken: string | null;
  participants: GroupOrderParticipant[];
  isHost: boolean;
  joinGroupOrder: (email: string, name: string) => Promise<boolean>;
  clearGroupToken: () => void;
  shareLink: string;
}

export function useGroupOrder(): UseGroupOrderReturn {
  const [groupToken, setGroupToken] = useState<string | null>(null);
  const [participants, setParticipants] = useState<GroupOrderParticipant[]>([]);
  const [isHost, setIsHost] = useState(false);

  // Check URL and localStorage for group token on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareParam = urlParams.get('share');
    
    if (shareParam) {
      // Store in both possible token keys for consistency
      localStorage.setItem('currentGroupToken', shareParam);
      localStorage.setItem('groupOrderToken', shareParam);
      setGroupToken(shareParam);
      setIsHost(false);
      
      // Clean up URL
      urlParams.delete('share');
      const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    } else {
      // Check both possible token storage locations
      const storedToken = localStorage.getItem('currentGroupToken') || localStorage.getItem('groupOrderToken');
      if (storedToken) {
        setGroupToken(storedToken);
        // Ensure both keys are synchronized
        localStorage.setItem('currentGroupToken', storedToken);
        localStorage.setItem('groupOrderToken', storedToken);
      }
    }
  }, []);

  // Set up real-time subscription when we have a group token
  useEffect(() => {
    if (!groupToken) return;

    const channel = supabase
      .channel('group-order-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_orders',
          filter: `share_token=eq.${groupToken}`
        },
        (payload) => {
          console.log('Group order update:', payload);
          fetchGroupOrderDetails();
        }
      )
      .subscribe();

    fetchGroupOrderDetails();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupToken]);

  const fetchGroupOrderDetails = async () => {
    if (!groupToken) return;

    try {
      const { data, error } = await supabase
        .from('customer_orders')
        .select('*')
        .eq('share_token', groupToken)
        .eq('is_group_order', true)
        .single();

      if (error) throw error;

      if (data?.group_participants && Array.isArray(data.group_participants)) {
        setParticipants(data.group_participants as unknown as GroupOrderParticipant[]);
      } else {
        setParticipants([]);
      }
    } catch (error) {
      console.error('Error fetching group order details:', error);
    }
  };

  const joinGroupOrder = async (email: string, name: string): Promise<boolean> => {
    if (!groupToken) return false;

    try {
      // Validate groupToken is a valid UUID
      if (!groupToken.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error('Invalid group token format:', groupToken);
        return false;
      }

      const { data, error } = await supabase.functions.invoke('join_group_order_fixed', {
        body: {
          share_token: groupToken,
          user_email: email,
          user_name: name
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Join group order response:', data);

      if (data?.success) {
        await fetchGroupOrderDetails();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error joining group order:', error);
      return false;
    }
  };

  const clearGroupToken = () => {
    // Clear all possible group token storage locations
    localStorage.removeItem('currentGroupToken');
    localStorage.removeItem('groupOrderToken');
    localStorage.removeItem('groupOrderDeliveryInfo');
    localStorage.removeItem('partyondelivery_add_to_order');
    setGroupToken(null);
    setParticipants([]);
    setIsHost(false);
  };

  const shareLink = groupToken 
    ? `${window.location.origin}${window.location.pathname}?share=${groupToken}`
    : '';

  return {
    groupToken,
    participants,
    isHost,
    joinGroupOrder,
    clearGroupToken,
    shareLink
  };
}