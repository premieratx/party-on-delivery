import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FileSpreadsheet, 
  Upload, 
  Settings, 
  Clock,
  CheckCircle2,
  AlertCircle 
} from 'lucide-react';

interface SyncResult {
  success: boolean;
  synced?: {
    abandonedOrders?: number;
    completedOrders?: number;
  };
  errors?: {
    abandonedOrders?: string;
    completedOrders?: string;
  };
}

export const GoogleSheetsManager: React.FC = () => {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const { toast } = useToast();

  const extractSpreadsheetId = (url: string): string => {
    // Extract spreadsheet ID from Google Sheets URL
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  const handleSpreadsheetIdChange = (value: string) => {
    const id = extractSpreadsheetId(value);
    setSpreadsheetId(id);
  };

  const syncToSheets = async (syncType: 'abandoned' | 'completed' | 'both') => {
    if (!spreadsheetId) {
      toast({
        title: "Error",
        description: "Please enter a spreadsheet ID or URL first.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('sync-orders-to-sheets', {
        body: {
          spreadsheetId,
          syncType
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setSyncResult(data);
      setLastSync(new Date());

      if (data.success) {
        const syncedCount = Object.values(data.synced || {}).reduce((a: number, b: number) => a + b, 0);
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${syncedCount} records to Google Sheets.`,
        });
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error: any) {
      console.error('Error syncing to sheets:', error);
      toast({
        title: "Sync Error",
        description: error.message || "Failed to sync to Google Sheets.",
        variant: "destructive",
      });
      setSyncResult({ success: false });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Google Sheets Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="spreadsheet-url">Google Sheets URL or ID</Label>
            <Input
              id="spreadsheet-url"
              placeholder="https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit or just the ID"
              value={spreadsheetId}
              onChange={(e) => handleSpreadsheetIdChange(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Paste the full Google Sheets URL or just the spreadsheet ID. 
              Make sure the sheet is shared publicly or with the service account.
            </p>
          </div>

          {spreadsheetId && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Spreadsheet ID:</p>
              <p className="text-sm text-muted-foreground font-mono">{spreadsheetId}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Sync Orders to Sheets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              onClick={() => syncToSheets('abandoned')}
              disabled={!spreadsheetId || isSyncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              Sync Abandoned Orders
            </Button>
            
            <Button
              onClick={() => syncToSheets('completed')}
              disabled={!spreadsheetId || isSyncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Sync Completed Orders
            </Button>
            
            <Button
              onClick={() => syncToSheets('both')}
              disabled={!spreadsheetId || isSyncing}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Sync Both
            </Button>
          </div>

          {isSyncing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Syncing to Google Sheets...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Status */}
      {(lastSync || syncResult) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Sync Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastSync && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Sync:</span>
                <span className="text-sm text-muted-foreground">
                  {lastSync.toLocaleString()}
                </span>
              </div>
            )}

            {syncResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={syncResult.success ? "default" : "destructive"}>
                    {syncResult.success ? "Success" : "Failed"}
                  </Badge>
                </div>

                {syncResult.synced && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Records Synced:</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {syncResult.synced.abandonedOrders !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Abandoned Orders:</span>
                          <span className="ml-2 font-medium">{syncResult.synced.abandonedOrders}</span>
                        </div>
                      )}
                      {syncResult.synced.completedOrders !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Completed Orders:</span>
                          <span className="ml-2 font-medium">{syncResult.synced.completedOrders}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {syncResult.errors && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-destructive">Errors:</p>
                    <div className="space-y-1 text-sm">
                      {syncResult.errors.abandonedOrders && (
                        <div className="text-destructive">
                          Abandoned Orders: {syncResult.errors.abandonedOrders}
                        </div>
                      )}
                      {syncResult.errors.completedOrders && (
                        <div className="text-destructive">
                          Completed Orders: {syncResult.errors.completedOrders}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="space-y-2">
            <p className="font-medium">To use this integration:</p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Create a new Google Sheets document</li>
              <li>Copy the spreadsheet URL or ID and paste it above</li>
              <li>Make sure the spreadsheet is shared publicly (view access) or with the service account</li>
              <li>Click any of the sync buttons to create tabs and sync data</li>
            </ol>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">Spreadsheet Structure:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>Abandoned Orders</strong> tab: Customer info, cart details, abandonment time</li>
              <li><strong>Completed Orders</strong> tab: Order details, customer info, delivery info</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};