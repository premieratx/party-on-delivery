import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, X } from 'lucide-react';

/**
 * HOMEPAGE COVER MODAL FEATURE DISABLED
 * 
 * This replaces the HomepageCoverSettings component to prevent
 * any cover page modal from interfering with the main delivery app homepage.
 * 
 * The feature was causing popup interference and background image loading issues.
 */
export const HomepageCoverDisabled: React.FC = () => {
  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <X className="w-5 h-5" />
          Homepage Cover Modal - DISABLED
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-800">Feature Permanently Disabled</p>
            <p className="text-xs text-red-600">
              Homepage cover modal has been disabled to prevent popup interference with the main delivery app.
              This was causing background image loading issues and color flashing on homepage refresh.
            </p>
          </div>
          <Badge variant="destructive" className="text-xs">
            DISABLED
          </Badge>
        </div>
        
        <div className="bg-red-100 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-800">
            <div className="font-semibold mb-2">Why was this disabled?</div>
            <ul className="space-y-1 text-xs">
              <li>• Caused popup interference on homepage</li>
              <li>• Created background image loading delays</li>
              <li>• Caused screen color flashing during load</li>
              <li>• Interfered with main delivery app functionality</li>
            </ul>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          If you need cover page functionality, use dedicated cover page URLs instead: /cover/your-page-slug
        </div>
      </CardContent>
    </Card>
  );
};