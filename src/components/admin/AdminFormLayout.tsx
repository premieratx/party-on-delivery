import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Eye } from 'lucide-react';

interface AdminFormLayoutProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onSave?: () => void;
  onPreview?: () => void;
  saving?: boolean;
  canSave?: boolean;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}

export const AdminFormLayout: React.FC<AdminFormLayoutProps> = ({
  title,
  subtitle,
  onBack,
  onSave,
  onPreview,
  saving = false,
  canSave = true,
  children,
  headerActions
}) => {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {headerActions}
            {onPreview && (
              <Button variant="outline" size="sm" onClick={onPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
            {onSave && (
              <Button
                onClick={onSave}
                disabled={saving || !canSave}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {children}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

interface AdminFormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const AdminFormSection: React.FC<AdminFormSectionProps> = ({
  title,
  description,
  children
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
};