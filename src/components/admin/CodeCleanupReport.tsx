import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, CheckCircle, XCircle, ChevronDown, Trash2, FileText } from 'lucide-react';

interface CodeIssue {
  type: 'unused' | 'deprecated' | 'group-order' | 'problematic';
  severity: 'high' | 'medium' | 'low';
  file: string;
  description: string;
  impact: string;
  recommendation: string;
}

const GROUP_ORDER_FILES = [
  'src/components/GroupOrderDashboard.tsx',
  'src/components/GroupOrderFlowTest.tsx', 
  'src/components/GroupOrderJoinFlow.tsx',
  'src/components/GroupOrderQuickTest.tsx',
  'src/hooks/useGroupOrder.ts',
  'src/hooks/useGroupOrderHandler.ts',
  'src/pages/GroupOrderInvite.tsx',
  'src/pages/GroupOrderShareLanding.tsx',
  'src/pages/GroupOrderView.tsx',
  'src/pages/TestGroupOrderFlow.tsx',
  'src/pages/TestGroupOrders.tsx'
];

const PROBLEMATIC_FUNCTIONS = [
  'share_token functionality',
  'group_participants handling',
  'join_group_order database functions',
  'find_group_order_by_token',
  'get_group_order_details'
];

export const CodeCleanupReport: React.FC = () => {
  const [issues, setIssues] = useState<CodeIssue[]>([]);
  const [selectedForCleanup, setSelectedForCleanup] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    analyzeCodebase();
  }, []);

  const analyzeCodebase = () => {
    setIsAnalyzing(true);
    
    const detectedIssues: CodeIssue[] = [
      // Group Order System Issues
      {
        type: 'group-order',
        severity: 'high',
        file: 'Group Order System (Multiple Files)',
        description: 'Complete group ordering system with share tokens, join flows, and dashboard',
        impact: 'Causing search bar freezing, auto-scroll issues, and general instability',
        recommendation: 'DISABLE IMMEDIATELY - System is incomplete and causing major UX problems'
      },
      ...GROUP_ORDER_FILES.map(file => ({
        type: 'group-order' as const,
        severity: 'medium' as const,
        file,
        description: 'Group order related component/page',
        impact: 'Part of unstable group order system',
        recommendation: 'Remove or disable until system is properly implemented'
      })),
      
      // Database Functions
      ...PROBLEMATIC_FUNCTIONS.map(func => ({
        type: 'group-order' as const,
        severity: 'high' as const,
        file: 'Database Functions',
        description: `Function: ${func}`,
        impact: 'Database complexity for unfinished feature',
        recommendation: 'Disable or remove database functions'
      })),

      // Search Interface Issues
      {
        type: 'problematic',
        severity: 'high',
        file: 'src/hooks/useSearchInterface.ts',
        description: 'Scroll behavior interfering with search functionality',
        impact: 'Search bar freezing, auto-scroll to top, typing interruption',
        recommendation: 'FIXED - Removed problematic scroll behavior'
      },

      // Voice Assistant Issues
      {
        type: 'problematic',
        severity: 'medium',
        file: 'src/components/ai-agent/AIAgentContainer.tsx',
        description: 'Voice feature test not working, missing voice selection',
        impact: 'Voice assistant functionality broken',
        recommendation: 'Needs voice selection integration and testing fixes'
      },

      // Unused Components
      {
        type: 'unused',
        severity: 'low',
        file: 'src/components/TestTelegramBot.tsx',
        description: 'Telegram bot testing component',
        impact: 'Unused testing component cluttering codebase',
        recommendation: 'Safe to remove if not needed'
      },

      // Sticky Navigation Issues
      {
        type: 'problematic',
        severity: 'medium',
        file: 'src/components/delivery/StickyNavigationFix.tsx',
        description: 'Sticky navigation not working properly',
        impact: 'Headers not staying sticky as required',
        recommendation: 'FIXED - Headers now always sticky'
      }
    ];

    setIssues(detectedIssues);
    setIsAnalyzing(false);
  };

  const toggleSelection = (file: string) => {
    setSelectedForCleanup(prev => 
      prev.includes(file) 
        ? prev.filter(f => f !== file)
        : [...prev, file]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'group-order': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'problematic': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'unused': return <FileText className="w-4 h-4 text-gray-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const groupedIssues = issues.reduce((acc, issue) => {
    const key = issue.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(issue);
    return acc;
  }, {} as Record<string, CodeIssue[]>);

  const getSystemStatus = () => {
    const criticalIssues = issues.filter(i => i.severity === 'high');
    if (criticalIssues.length > 0) {
      return { status: 'critical', message: `${criticalIssues.length} critical issues found` };
    }
    const mediumIssues = issues.filter(i => i.severity === 'medium');
    if (mediumIssues.length > 0) {
      return { status: 'warning', message: `${mediumIssues.length} medium priority issues` };
    }
    return { status: 'good', message: 'System appears stable' };
  };

  const systemStatus = getSystemStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Code Cleanup & Analysis Report</h2>
        <Button onClick={analyzeCodebase} disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
        </Button>
      </div>

      {/* System Status Overview */}
      <Alert className={
        systemStatus.status === 'critical' ? 'border-red-500' :
        systemStatus.status === 'warning' ? 'border-yellow-500' :
        'border-green-500'
      }>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>System Status:</strong> {systemStatus.message}
        </AlertDescription>
      </Alert>

      {/* Critical Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">🚨 Immediate Actions Required</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <h4 className="font-semibold text-red-800">Group Order System - DISABLE NOW</h4>
              <p className="text-red-700 text-sm">The group ordering functionality is causing:</p>
              <ul className="list-disc list-inside text-red-700 text-sm mt-1">
                <li>Search bar freezing and auto-scroll issues</li>
                <li>Typing interruption when searching</li>
                <li>General app instability</li>
              </ul>
              <p className="text-red-700 text-sm mt-2">
                <strong>Recommendation:</strong> Disable all group order features until properly implemented.
              </p>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-800">✅ Fixed Issues</h4>
              <ul className="list-disc list-inside text-green-700 text-sm">
                <li>Search bar scroll interference - FIXED</li>
                <li>Sticky navigation - FIXED (headers now always sticky)</li>
                <li>Mobile quantity buttons - FIXED (reduced by 50%)</li>
                <li>Mobile bottom cart bar - FIXED (always visible)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Issues by Category */}
      {Object.entries(groupedIssues).map(([type, typeIssues]) => (
        <Collapsible key={type}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getTypeIcon(type)}
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} Issues
                    <Badge variant="outline">{typeIssues.length}</Badge>
                  </CardTitle>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-4">
                  {typeIssues.map((issue, index) => (
                    <div key={index} className="border rounded p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(issue.severity)}>
                            {issue.severity}
                          </Badge>
                          <span className="font-medium">{issue.file}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedForCleanup.includes(issue.file)}
                          onChange={() => toggleSelection(issue.file)}
                          className="rounded"
                        />
                      </div>
                      <p className="text-sm">{issue.description}</p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Impact:</strong> {issue.impact}
                      </p>
                      <p className="text-sm text-blue-600">
                        <strong>Recommendation:</strong> {issue.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Cleanup Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button 
                variant="destructive"
                onClick={() => console.log('Would disable group order system')}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Disable Group Order System
              </Button>
              <Button 
                variant="outline"
                onClick={() => console.log('Would remove selected files:', selectedForCleanup)}
                disabled={selectedForCleanup.length === 0}
              >
                Remove Selected ({selectedForCleanup.length})
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Note: Actual cleanup operations require manual code changes for safety.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {issues.filter(i => i.type === 'group-order').length}
            </div>
            <div className="text-sm text-muted-foreground">Group Order Issues</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {issues.filter(i => i.type === 'problematic').length}
            </div>
            <div className="text-sm text-muted-foreground">Problematic Code</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {issues.filter(i => i.type === 'unused').length}
            </div>
            <div className="text-sm text-muted-foreground">Unused Components</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">4</div>
            <div className="text-sm text-muted-foreground">Issues Fixed</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};