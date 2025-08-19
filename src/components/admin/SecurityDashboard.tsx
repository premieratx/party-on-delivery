import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecurityStatus {
  rls_status: {
    total_tables: number;
    secured_tables: number;
    coverage_percent: number;
  };
  function_security: {
    insecure_functions: string[];
    insecure_count: number;
  };
  view_security: {
    security_definer_views: string[];
    problematic_count: number;
  };
  extension_security: {
    extensions_in_public: string[];
    extension_count: number;
  };
  overall_status: 'SECURE' | 'NEEDS_ATTENTION';
  last_check: string;
}

export const SecurityDashboard: React.FC = () => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [enforcing, setEnforcing] = useState(false);

  const fetchSecurityStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('comprehensive_security_check');
      if (error) throw error;
      setSecurityStatus(data as unknown as SecurityStatus);
    } catch (error) {
      toast.error('Failed to fetch security status');
      console.error('Security check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const enforceSecurityStandards = async () => {
    setEnforcing(true);
    try {
      const { data, error } = await supabase.rpc('enforce_security_standards');
      if (error) throw error;
      
      const result = data as { enforcements_applied: number; status: string };
      toast.success(`Applied ${result.enforcements_applied} security enforcements`);
      await fetchSecurityStatus(); // Refresh status
    } catch (error) {
      toast.error('Failed to enforce security standards');
      console.error('Security enforcement error:', error);
    } finally {
      setEnforcing(false);
    }
  };

  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading security status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!securityStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to load security status. Please check your database connection.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isSecure = securityStatus.overall_status === 'SECURE';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive security monitoring and enforcement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {isSecure ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <Badge 
                variant={isSecure ? 'default' : 'destructive'}
                className={isSecure ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
              >
                {securityStatus.overall_status}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={fetchSecurityStatus}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={enforceSecurityStandards}
                disabled={enforcing}
              >
                <Shield className={`h-4 w-4 mr-2 ${enforcing ? 'animate-spin' : ''}`} />
                Enforce Standards
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* RLS Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">RLS Protection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {securityStatus.rls_status.coverage_percent}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {securityStatus.rls_status.secured_tables} of{' '}
                  {securityStatus.rls_status.total_tables} tables secured
                </p>
              </CardContent>
            </Card>

            {/* Function Security */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Function Security</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {securityStatus.function_security.insecure_count}
                </div>
                <p className="text-xs text-muted-foreground">
                  Insecure functions detected
                </p>
                {securityStatus.function_security.insecure_count > 0 && (
                  <Badge variant="destructive" className="mt-1">
                    Needs Fix
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* View Security */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">View Security</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {securityStatus.view_security.problematic_count}
                </div>
                <p className="text-xs text-muted-foreground">
                  Security definer views
                </p>
                {securityStatus.view_security.problematic_count > 0 && (
                  <Badge variant="destructive" className="mt-1">
                    Critical
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Extension Security */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Extensions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {securityStatus.extension_security.extension_count}
                </div>
                <p className="text-xs text-muted-foreground">
                  Extensions in public schema
                </p>
                {securityStatus.extension_security.extension_count > 0 && (
                  <Badge variant="outline" className="mt-1">
                    Review
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Security Issues Details */}
          {!isSecure && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">Security Issues Detected</h3>
              
              {securityStatus.function_security.insecure_count > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Insecure Functions:</strong>{' '}
                    {securityStatus.function_security.insecure_functions.join(', ')}
                    <br />
                    <em>Add SET search_path = 'public', 'pg_catalog' to these functions</em>
                  </AlertDescription>
                </Alert>
              )}

              {securityStatus.view_security.problematic_count > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Definer Views:</strong>{' '}
                    {securityStatus.view_security.security_definer_views.join(', ')}
                    <br />
                    <em>Replace these views with secure functions</em>
                  </AlertDescription>
                </Alert>
              )}

              {securityStatus.extension_security.extension_count > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Extensions in Public Schema:</strong>{' '}
                    {securityStatus.extension_security.extensions_in_public.join(', ')}
                    <br />
                    <em>Consider moving to extensions schema</em>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
            Last checked: {new Date(securityStatus.last_check).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;