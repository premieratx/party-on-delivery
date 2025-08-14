import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Palette, Users } from 'lucide-react';
import { ImprovedQuoteCreator } from '@/components/admin/ImprovedQuoteCreator';
import { DraggableQuoteTemplateBuilder } from '@/components/admin/DraggableQuoteTemplateBuilder';

export default function AdminQuote() {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Quote Management System
            </CardTitle>
            <p className="text-muted-foreground">
              Create custom quotes for clients and design quote templates
            </p>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Create Quote
            </TabsTrigger>
            <TabsTrigger value="design" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Design Template
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6">
            <ImprovedQuoteCreator />
          </TabsContent>

          <TabsContent value="design" className="mt-6">
            <DraggableQuoteTemplateBuilder />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}