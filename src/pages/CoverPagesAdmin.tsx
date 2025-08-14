import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Layout, 
  Plus, 
  Monitor, 
  Smartphone, 
  Eye, 
  Settings,
  Download,
  Upload
} from 'lucide-react';
import { UnifiedCoverPageCreator } from '@/components/admin/UnifiedCoverPageCreator';
import { toast } from 'sonner';

interface CoverPageProject {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
  devices: string[];
  status: 'draft' | 'published';
}

export default function CoverPagesAdmin() {
  const [showCreator, setShowCreator] = useState(false);
  const [projects, setProjects] = useState<CoverPageProject[]>([
    {
      id: '1',
      name: 'Main App Landing',
      createdAt: '2024-01-15',
      lastModified: '2024-01-20',
      devices: ['Desktop', 'iPhone 14 Pro', 'Galaxy S23', 'Pixel 7'],
      status: 'published'
    },
    {
      id: '2',
      name: 'Mobile Onboarding',
      createdAt: '2024-01-18',
      lastModified: '2024-01-22',
      devices: ['iPhone 14 Pro', 'Galaxy S23', 'Pixel 7'],
      status: 'draft'
    }
  ]);

  const handleSaveProject = (settings: any) => {
    // In a real implementation, this would save to your backend
    console.log('Saving project settings:', settings);
    toast.success('Cover page project saved successfully!');
    
    // For demo purposes, add to projects list
    const newProject: CoverPageProject = {
      id: Date.now().toString(),
      name: `Project ${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      devices: Object.keys(settings),
      status: 'draft'
    };
    
    setProjects(prev => [newProject, ...prev]);
    setShowCreator(false);
  };

  const exportProject = (projectId: string) => {
    // In a real implementation, this would export the project
    toast.info('Exporting project...');
  };

  const duplicateProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const duplicate: CoverPageProject = {
        ...project,
        id: Date.now().toString(),
        name: `${project.name} (Copy)`,
        createdAt: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0],
        status: 'draft'
      };
      setProjects(prev => [duplicate, ...prev]);
      toast.success('Project duplicated');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Layout className="h-6 w-6" />
                  Cover Page Creator
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Create responsive cover pages for desktop and mobile devices with templates and custom designs
                </p>
              </div>
              <Button 
                onClick={() => setShowCreator(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Cover Page
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Monitor className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Multi-Device Support</h3>
                  <p className="text-sm text-muted-foreground">Desktop + 3 popular mobile devices</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Upload className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Media Upload</h3>
                  <p className="text-sm text-muted-foreground">Upload images, videos, and logos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Settings className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-semibold">10+ Templates</h3>
                  <p className="text-sm text-muted-foreground">Pre-designed templates for quick start</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Cover Page Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <Layout className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-4">Create your first cover page project to get started</p>
                <Button onClick={() => setShowCreator(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Project
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{project.name}</h3>
                          <Badge variant={project.status === 'published' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Created: {project.createdAt}</span>
                          <span>Modified: {project.lastModified}</span>
                          <div className="flex items-center gap-1">
                            <span>Devices:</span>
                            {project.devices.slice(0, 2).map((device, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {device}
                              </Badge>
                            ))}
                            {project.devices.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{project.devices.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* TODO: Open preview */}}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* TODO: Edit project */}}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportProject(project.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateProject(project.id)}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Support Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Supported Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <Monitor className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold">Desktop</p>
                  <p className="text-sm text-muted-foreground">1200x800</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <Smartphone className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold">iPhone 14 Pro</p>
                  <p className="text-sm text-muted-foreground">393x852</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <Smartphone className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold">Galaxy S23</p>
                  <p className="text-sm text-muted-foreground">360x780</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <Smartphone className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold">Pixel 7</p>
                  <p className="text-sm text-muted-foreground">412x915</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unified Cover Page Creator Modal */}
      <UnifiedCoverPageCreator
        isOpen={showCreator}
        onClose={() => setShowCreator(false)}
        onSave={handleSaveProject}
      />
    </div>
  );
}