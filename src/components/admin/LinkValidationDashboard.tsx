import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Link as LinkIcon,
  Users,
  Globe,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ValidationResult {
  type: string;
  url: string;
  valid: boolean;
  status: string | number;
  tested_at: string;
  error?: string;
  affiliate_code?: string;
  affiliate_name?: string;
  affiliate_email?: string;
  app_name?: string;
  app_slug?: string;
  short_path?: string;
  page_title?: string;
  slug?: string;
}

interface ValidationRun {
  id: string;
  validation_run_id: string;
  results: ValidationResult[];
  total_tested: number;
  total_valid: number;
  total_invalid: number;
  created_at: string;
}

export const LinkValidationDashboard: React.FC = () => {
  const [validationRuns, setValidationRuns] = useState<ValidationRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchValidationHistory = async () => {
    try {
      // For now, use a mock implementation since the table doesn't exist yet
      const mockData: ValidationRun[] = [
        {
          id: '1',
          validation_run_id: 'run-1',
          results: [],
          total_tested: 0,
          total_valid: 0,
          total_invalid: 0,
          created_at: new Date().toISOString()
        }
      ];
      setValidationRuns(mockData);
    } catch (error) {
      console.error('Error fetching validation history:', error);
      toast.error('Failed to load validation history');
    } finally {
      setLoading(false);
    }
  };

  const runValidation = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-affiliate-links');
      
      if (error) throw error;
      
      toast.success(`Validation complete! ${data.total_valid}/${data.total_tested} links are working`);
      
      if (data.total_invalid > 0) {
        toast.warning(`${data.total_invalid} links need attention`);
      }
      
      // Refresh the validation history
      await fetchValidationHistory();
    } catch (error) {
      console.error('Error running validation:', error);
      toast.error('Failed to run link validation');
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    fetchValidationHistory();
  }, []);

  const latestRun = validationRuns[0];

  const renderValidationResult = (result: ValidationResult) => {
    const getStatusColor = () => {
      if (result.valid) return 'text-green-600';
      if (result.status === 'error') return 'text-red-600';
      return 'text-orange-600';
    };

    const getStatusIcon = () => {
      if (result.valid) return <CheckCircle className="w-4 h-4 text-green-600" />;
      return <XCircle className="w-4 h-4 text-red-600" />;
    };

    return (
      <div key={result.url} className="border rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant={result.type === 'affiliate' ? 'default' : result.type === 'cover_page' ? 'secondary' : 'outline'}>
              {result.type.replace('_', ' ')}
            </Badge>
          </div>
          <span className={`text-sm font-mono ${getStatusColor()}`}>
            {result.status}
          </span>
        </div>
        
        <div>
          <p className="font-semibold text-sm">
            {result.affiliate_name || result.app_name || result.page_title || 'Unknown'}
          </p>
          <p className="text-xs text-muted-foreground">
            {result.affiliate_code || result.app_slug || result.slug}
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <a 
            href={result.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Test Link
          </a>
          <span className="text-xs text-muted-foreground">
            {new Date(result.tested_at).toLocaleTimeString()}
          </span>
        </div>
        
        {result.error && (
          <div className="bg-red-50 border border-red-200 rounded p-2">
            <p className="text-xs text-red-700">{result.error}</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Link Validation Dashboard
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Monitor and validate all affiliate links, app shortcuts, and cover pages
                </p>
              </div>
            </div>
            <Button 
              onClick={runValidation} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Validating...' : 'Run Validation'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Latest Results Summary */}
      {latestRun && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{latestRun.total_tested}</p>
                  <p className="text-xs text-muted-foreground">Total Links</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{latestRun.total_valid}</p>
                  <p className="text-xs text-muted-foreground">Working</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{latestRun.total_invalid}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm font-semibold">
                    {new Date(latestRun.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Last Check</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Results */}
      {latestRun && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="failed" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="failed">
                  Failed Links ({latestRun.results.filter(r => !r.valid).length})
                </TabsTrigger>
                <TabsTrigger value="working">
                  Working Links ({latestRun.results.filter(r => r.valid).length})
                </TabsTrigger>
                <TabsTrigger value="all">All Links</TabsTrigger>
              </TabsList>

              <TabsContent value="failed" className="space-y-4">
                {latestRun.results.filter(r => !r.valid).length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-green-600 font-semibold">All links are working! 🎉</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {latestRun.results.filter(r => !r.valid).map(renderValidationResult)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="working" className="space-y-4">
                <div className="grid gap-4">
                  {latestRun.results.filter(r => r.valid).map(renderValidationResult)}
                </div>
              </TabsContent>

              <TabsContent value="all" className="space-y-4">
                <div className="grid gap-4">
                  {latestRun.results.map(renderValidationResult)}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Historical Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Validation History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {validationRuns.map((run) => (
              <div key={run.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(run.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {run.total_tested} links tested
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={run.total_invalid === 0 ? 'default' : 'destructive'}>
                    {run.total_valid}/{run.total_tested} working
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};