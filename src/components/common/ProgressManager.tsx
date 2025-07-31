import React, { useEffect, useState } from 'react';
import { useProgressSaver } from '@/hooks/useProgressSaver';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, Download, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ProgressManagerProps {
  currentData: any;
  dataType: 'cart' | 'checkout' | 'preferences' | 'general';
  pageContext?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

export const ProgressManager: React.FC<ProgressManagerProps> = ({
  currentData,
  dataType,
  pageContext,
  autoSave = true,
  autoSaveInterval = 30000,
}) => {
  const {
    saveProgress,
    loadProgress,
    saveCart,
    loadCart,
    savePreferences,
    loadPreferences,
    saveAppSnapshot,
    enableAutoSave,
    isLoading,
  } = useProgressSaver();
  
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !currentData) return;

    const cleanup = enableAutoSave(
      dataType,
      () => currentData,
      autoSaveInterval
    );

    return cleanup;
  }, [autoSave, currentData, dataType, autoSaveInterval, enableAutoSave]);

  // Track changes
  useEffect(() => {
    if (currentData && Object.keys(currentData).length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [currentData]);

  const handleSave = async () => {
    if (!currentData) return;

    try {
      switch (dataType) {
        case 'cart':
          await saveCart(currentData);
          break;
        case 'preferences':
          await savePreferences(currentData);
          break;
        default:
          await saveProgress({
            progressType: dataType,
            data: currentData,
            pageContext,
          });
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      toast({
        title: "Progress Saved",
        description: `Your ${dataType} has been saved successfully.`,
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLoad = async () => {
    try {
      let data = null;
      
      switch (dataType) {
        case 'cart':
          data = await loadCart();
          break;
        case 'preferences':
          data = await loadPreferences();
          break;
        default:
          data = await loadProgress(dataType, pageContext);
      }

      if (data) {
        // This would typically trigger a callback to update the parent component
        toast({
          title: "Progress Loaded",
          description: `Your saved ${dataType} has been restored.`,
        });
        return data;
      } else {
        toast({
          title: "No Saved Data",
          description: `No saved ${dataType} found.`,
        });
      }
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load your saved progress.",
        variant: "destructive",
      });
    }
  };

  const handleCreateSnapshot = async () => {
    const snapshotName = `${dataType}-${format(new Date(), 'yyyy-MM-dd-HH:mm')}`;
    await saveAppSnapshot(snapshotName, currentData);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Progress Manager
          </span>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              Unsaved Changes
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !currentData}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Progress
          </Button>
          
          <Button 
            onClick={handleLoad} 
            variant="outline"
            disabled={isLoading}
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Load Saved
          </Button>
          
          <Button 
            onClick={handleCreateSnapshot} 
            variant="outline"
            disabled={isLoading || !currentData}
            size="sm"
          >
            <Clock className="h-4 w-4 mr-2" />
            Create Snapshot
          </Button>
        </div>

        {lastSaved && (
          <div className="text-sm text-muted-foreground">
            Last saved: {format(lastSaved, 'MMM d, yyyy h:mm a')}
          </div>
        )}

        {autoSave && (
          <div className="text-xs text-muted-foreground">
            Auto-save enabled (every {Math.round(autoSaveInterval / 1000)}s)
          </div>
        )}
      </CardContent>
    </Card>
  );
};