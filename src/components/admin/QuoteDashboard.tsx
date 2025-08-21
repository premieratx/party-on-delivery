import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UnifiedQuoteCreator } from "./UnifiedQuoteCreator";
import { QuoteManager } from "./QuoteManager";
import { FileText, Users, Settings } from "lucide-react";

export const QuoteDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('manual');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quote Management Dashboard
            </CardTitle>
            <Badge variant="outline">Production Ready</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Manual Creator
              </TabsTrigger>
              <TabsTrigger value="manage" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Manage Quotes
              </TabsTrigger>
              <TabsTrigger value="affiliate" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Affiliate Tools
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-6">
              <UnifiedQuoteCreator source="admin" />
            </TabsContent>

            <TabsContent value="manage" className="mt-6">
              <QuoteManager />
            </TabsContent>

            <TabsContent value="affiliate" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Affiliate Quote Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Tools for affiliates to create and send quotes to their clients.
                    </p>
                    <UnifiedQuoteCreator source="affiliate" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};