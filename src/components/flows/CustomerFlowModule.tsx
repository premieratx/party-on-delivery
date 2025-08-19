import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Workflow, ArrowRight, Eye, Settings } from 'lucide-react';

interface CustomerFlow {
  id: string;
  name: string;
  slug: string;
  cover_page_id: string | null;
  delivery_app_id: string | null;
  post_checkout_id: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  // Related data
  cover_page?: { title: string; slug: string } | null;
  delivery_app?: { app_name: string; app_slug: string } | null;
}

interface CustomerFlowModuleProps {
  onFlowSelect?: (flow: CustomerFlow) => void;
  selectedFlowId?: string;
  showControls?: boolean;
}

export const CustomerFlowModule: React.FC<CustomerFlowModuleProps> = ({
  onFlowSelect,
  selectedFlowId,
  showControls = false
}) => {
  const [flows, setFlows] = useState<CustomerFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      setLoading(true);
      
      // Load flows first
      const { data: flowsData, error: flowsError } = await supabase
        .from('customer_flows')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (flowsError) throw flowsError;

      // Enrich with related data
      const enrichedFlows: CustomerFlow[] = [];
      
      for (const flow of flowsData || []) {
        const enrichedFlow: CustomerFlow = {
          ...flow,
          cover_page: null,
          delivery_app: null
        };

        // Get cover page data
        if (flow.cover_page_id) {
          const { data: coverPage } = await supabase
            .from('cover_pages')
            .select('title, slug')
            .eq('id', flow.cover_page_id)
            .single();
          enrichedFlow.cover_page = coverPage;
        }

        // Get delivery app data
        if (flow.delivery_app_id) {
          const { data: deliveryApp } = await supabase
            .from('delivery_app_variations')
            .select('app_name, app_slug')
            .eq('id', flow.delivery_app_id)
            .single();
          enrichedFlow.delivery_app = deliveryApp;
        }

        enrichedFlows.push(enrichedFlow);
      }

      setFlows(enrichedFlows);
    } catch (error) {
      console.error('Error loading customer flows:', error);
      toast({ title: 'Error loading flows', description: 'Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleFlowSelect = (flow: CustomerFlow) => {
    onFlowSelect?.(flow);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="w-5 h-5" />
            Customer Flow Module
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete customer journeys that can be assigned to affiliates
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {flows.map((flow) => (
              <Card 
                key={flow.id}
                className={`transition-all hover:shadow-md ${
                  selectedFlowId === flow.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{flow.name}</h3>
                          {flow.is_default && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                          <Badge variant={flow.is_active ? 'default' : 'outline'}>
                            {flow.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Slug: /{flow.slug}</p>
                      </div>
                      
                      {showControls && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleFlowSelect(flow)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Flow Journey Visualization */}
                    <div className="flex items-center gap-4">
                      {/* Cover Page */}
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Cover Page</div>
                        <div className={`p-2 border rounded text-sm ${
                          flow.cover_page ? 'bg-primary/5' : 'bg-muted'
                        }`}>
                          {flow.cover_page ? (
                            <div>
                              <div className="font-medium">{flow.cover_page.title}</div>
                              <div className="text-xs text-muted-foreground">/{flow.cover_page.slug}</div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">No cover page</div>
                          )}
                        </div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-muted-foreground" />

                      {/* Delivery App */}
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Delivery App</div>
                        <div className={`p-2 border rounded text-sm ${
                          flow.delivery_app ? 'bg-primary/5' : 'bg-muted'
                        }`}>
                          {flow.delivery_app ? (
                            <div>
                              <div className="font-medium">{flow.delivery_app.app_name}</div>
                              <div className="text-xs text-muted-foreground">/app/{flow.delivery_app.app_slug}</div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">No delivery app</div>
                          )}
                        </div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-muted-foreground" />

                      {/* Post Checkout */}
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Post-Purchase</div>
                        <div className="p-2 border rounded text-sm bg-muted">
                          <div className="text-muted-foreground">Default completion page</div>
                        </div>
                      </div>
                    </div>

                    {!showControls && (
                      <Button 
                        variant="outline" 
                        onClick={() => handleFlowSelect(flow)}
                        className="w-full"
                      >
                        Select This Flow
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {flows.length === 0 && (
              <div className="text-center py-8">
                <Workflow className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No customer flows available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedFlowId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Flow</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {(() => {
              const selectedFlow = flows.find(f => f.id === selectedFlowId);
              return selectedFlow ? (
                <div className="space-y-2">
                  <p className="font-medium">{selectedFlow.name}</p>
                  <p className="text-sm text-muted-foreground">/{selectedFlow.slug}</p>
                  <div className="flex gap-2">
                    {selectedFlow.cover_page && (
                      <Badge variant="outline">Cover: {selectedFlow.cover_page.title}</Badge>
                    )}
                    {selectedFlow.delivery_app && (
                      <Badge variant="outline">App: {selectedFlow.delivery_app.app_name}</Badge>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Flow not found</p>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};