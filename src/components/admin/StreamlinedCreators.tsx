import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, X } from 'lucide-react';

interface StreamlinedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  tabs?: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
  }>;
  children?: React.ReactNode;
  onSave?: () => void;
  saving?: boolean;
  saveLabel?: string;
}

export const StreamlinedModal: React.FC<StreamlinedModalProps> = ({
  open,
  onOpenChange,
  title,
  tabs,
  children,
  onSave,
  saving = false,
  saveLabel = "Save"
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col" aria-describedby="dialog-description">
        <DialogDescription className="sr-only">
          Streamlined creation interface
        </DialogDescription>
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
            <div className="flex items-center gap-2">
              {onSave && (
                <Button
                  onClick={onSave}
                  disabled={saving}
                  size="sm"
                  className="min-w-[100px]"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saving ? 'Saving...' : saveLabel}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {tabs ? (
            <Tabs defaultValue={tabs[0]?.id} className="h-full flex flex-col">
              <div className="px-6 pt-4 border-b flex-shrink-0">
                <TabsList className="grid w-full max-w-md" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
                  {tabs.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {tabs.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="mt-0">
                    <ScrollArea className="h-full">
                      {tab.content}
                    </ScrollArea>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          ) : (
            <ScrollArea className="h-full p-6">
              {children}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Pre-styled form components for consistency
export const FormSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="space-y-4 p-4 border rounded-lg">
    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
      {title}
    </h3>
    {children}
  </div>
);

export const FormGrid: React.FC<{
  children: React.ReactNode;
  cols?: number;
}> = ({ children, cols = 2 }) => (
  <div 
    className="grid gap-4" 
    style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
  >
    {children}
  </div>
);