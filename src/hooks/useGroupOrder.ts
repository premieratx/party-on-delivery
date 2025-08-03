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
      localStorage.setItem('currentGroupToken', shareParam);
      setGroupToken(shareParam);
      setIsHost(false);
    } else {
      const storedToken = localStorage.getItem('currentGroupToken');
      if (storedToken) {
        setGroupToken(storedToken);
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
      const { data, error } = await supabase.functions.invoke('join_group_order_fixed', {
        body: {
          share_token: groupToken,
          user_email: email,
          user_name: name
        }
      });

      if (error) throw error;

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
    localStorage.removeItem('currentGroupToken');
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