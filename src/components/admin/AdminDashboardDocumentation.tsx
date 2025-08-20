import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  Database, 
  Settings, 
  Users, 
  ShoppingCart,
  Layout,
  FileText,
  Workflow,
  Link,
  Palette,
  Eye,
  Code,
  Globe,
  Zap
} from 'lucide-react';

interface DocumentationSection {
  title: string;
  icon: any;
  content: {
    description?: string;
    purpose?: string;
    tables?: string[];
    features?: string[];
    configuration?: Record<string, string[]>;
    workflow?: string[];
    journey?: string[];
    themes?: Record<string, string>;
    keyTables?: Record<string, string>;
    relationships?: string[];
    security?: string[];
    integrations?: Record<string, string[]>;
    components?: string[];
    performance?: string[];
    ux?: string[];
    maintenance?: string[];
    optimization?: string[];
    shopifyIntegration?: string[];
    tracking?: string[];
    endpoints?: string[];
  };
}

export const AdminDashboardDocumentation = () => {
  const [openSections, setOpenSections] = useState<string[]>(['overview']);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const documentationSections: Record<string, DocumentationSection> = {
    overview: {
      title: "System Overview",
      icon: BookOpen,
      content: {
        description: "Complete admin dashboard system for managing delivery apps, customer flows, and affiliate programs.",
        components: [
          "Cover Page Creator - Landing page management",
          "Delivery App Creator - Multi-tab app configurations",
          "Post-Checkout Manager - Order completion experiences",
          "Affiliate Management - Partner program administration",
          "Customer Flow Builder - User journey orchestration"
        ]
      }
    },
    coverPages: {
      title: "Cover Page System",
      icon: Layout,
      content: {
        purpose: "Create and manage landing pages that serve as entry points for customer flows.",
        tables: ["cover_pages"],
        features: [
          "Visual editor with drag-and-drop components",
          "Theme system with predefined color schemes",
          "Logo and background image management",
          "Button configuration with custom URLs",
          "Affiliate assignment and tracking",
          "Multi-flow support for A/B testing",
          "Responsive design preview",
          "SEO optimization fields"
        ],
        configuration: {
          "Basic Settings": [
            "Title and subtitle configuration",
            "Slug generation for URLs",
            "Active/inactive status toggles",
            "Default homepage designation"
          ],
          "Visual Design": [
            "Logo upload and positioning",
            "Background image/video support",
            "Color scheme selection",
            "Custom CSS injection",
            "Mobile responsiveness"
          ],
          "Content Management": [
            "Checklist items with icons",
            "Call-to-action buttons",
            "Social proof elements",
            "Trust indicators"
          ],
          "Advanced Features": [
            "Affiliate slug assignment",
            "Flow branching logic",
            "Analytics tracking setup",
            "Conversion optimization"
          ]
        },
        workflow: [
          "1. Create new cover page with basic info",
          "2. Configure visual design and branding",
          "3. Add content sections and CTAs",
          "4. Assign to affiliate or set as default",
          "5. Preview across devices",
          "6. Publish and monitor performance"
        ]
      }
    },
    deliveryApps: {
      title: "Delivery App System",
      icon: ShoppingCart,
      content: {
        purpose: "Build custom delivery applications with multiple product categories and shopping experiences.",
        tables: ["delivery_app_variations", "customer_flows"],
        features: [
          "Multi-tab interface configuration",
          "Shopify collection integration",
          "Custom tab naming and ordering",
          "Product filtering and search",
          "Checkout flow customization",
          "Affiliate commission tracking",
          "Mobile-optimized design",
          "Real-time inventory sync"
        ],
        configuration: {
          "App Structure": [
            "App name and slug setup",
            "Tab configuration (name, Shopify collection)",
            "Number of tabs (1-6 supported)",
            "Tab ordering and visibility"
          ],
          "Product Management": [
            "Shopify collection mapping",
            "Category filtering rules",
            "Product display settings",
            "Inventory sync frequency"
          ],
          "Checkout Experience": [
            "Custom checkout flow assignment",
            "Post-checkout screen selection",
            "Payment method configuration",
            "Delivery options setup"
          ],
          "Branding": [
            "Logo and favicon upload",
            "Color scheme customization",
            "Font selection",
            "Custom CSS overrides"
          ]
        },
        shopifyIntegration: [
          "Collection-to-tab mapping system",
          "Product synchronization via API",
          "Inventory level monitoring",
          "Price update automation",
          "Category management integration"
        ]
      }
    },
    postCheckout: {
      title: "Post-Checkout System", 
      icon: FileText,
      content: {
        purpose: "Manage order confirmation pages and post-purchase customer experiences.",
        tables: ["post_checkout_screens"],
        features: [
          "Customizable confirmation messages",
          "Multi-button action configuration",
          "Theme-based styling system",
          "Logo and branding integration",
          "Affiliate-specific screens",
          "Template system for reuse",
          "Device-responsive previews",
          "Default screen management"
        ],
        configuration: {
          "Content Setup": [
            "Title and subtitle messaging",
            "Thank you message customization",
            "Logo upload and positioning",
            "Custom HTML injection"
          ],
          "Button Configuration": [
            "Up to 4 action buttons",
            "Button text and URL setup",
            "Primary/secondary styling",
            "External link indicators"
          ],
          "Visual Design": [
            "Theme selection (Success, Celebration, Elegant, Minimal)",
            "Background and text colors",
            "Custom CSS styling",
            "Brand consistency"
          ],
          "Associations": [
            "Cover page linking",
            "Affiliate assignment",
            "Flow integration",
            "Template designation"
          ]
        },
        themes: {
          "Success": "Green-based theme for order confirmations",
          "Celebration": "Gold/yellow theme for special occasions", 
          "Elegant": "Purple theme for premium brands",
          "Minimal": "Gray theme for clean, simple design"
        }
      }
    },
    affiliates: {
      title: "Affiliate Management",
      icon: Users,
      content: {
        purpose: "Comprehensive partner program management with commission tracking and performance analytics.",
        tables: ["affiliates", "affiliate_referrals", "affiliate_order_tracking", "affiliate_flows"],
        features: [
          "Affiliate registration and approval",
          "Commission rate management",
          "Order tracking and attribution",
          "Performance analytics dashboard",
          "Custom affiliate flows",
          "Payout management system",
          "Referral link generation",
          "Multi-tier commission structure"
        ],
        configuration: {
          "Affiliate Setup": [
            "Company information collection",
            "Contact details and verification",
            "Custom handle generation",
            "Status management (active/inactive)"
          ],
          "Commission Structure": [
            "Percentage or fixed amount rates",
            "Tiered commission levels",
            "Product-specific rates",
            "Performance bonuses"
          ],
          "Tracking System": [
            "UTM parameter generation",
            "Cookie-based attribution",
            "Cross-device tracking",
            "Conversion attribution windows"
          ],
          "Flow Assignment": [
            "Custom affiliate flows",
            "Cover page assignments",
            "Delivery app configurations",
            "Post-checkout experiences"
          ]
        },
        tracking: [
          "Session-based tracking with cookies",
          "Order attribution to affiliate sources",
          "Commission calculation automation",
          "Performance metrics collection",
          "Payout preparation and management"
        ]
      }
    },
    customerFlows: {
      title: "Customer Flow System",
      icon: Workflow,
      content: {
        purpose: "Orchestrate complete customer journeys from landing to post-purchase.",
        tables: ["customer_flows", "affiliate_flow_assignments"],
        features: [
          "Multi-step flow configuration",
          "Component linking system",
          "A/B testing capabilities",
          "Flow performance tracking",
          "Default flow management",
          "Affiliate-specific flows",
          "Conversion optimization",
          "User journey analytics"
        ],
        configuration: {
          "Flow Structure": [
            "Flow name and slug setup",
            "Cover page assignment",
            "Delivery app selection",
            "Post-checkout screen linking"
          ],
          "Flow Logic": [
            "Conditional branching rules",
            "User segment targeting",
            "Device-specific flows",
            "Geo-location routing"
          ],
          "Performance": [
            "Conversion tracking setup",
            "Analytics integration",
            "Split testing configuration",
            "Optimization recommendations"
          ],
          "Management": [
            "Active/inactive status",
            "Default flow designation",
            "Template creation",
            "Bulk operations"
          ]
        },
        journey: [
          "1. User lands on cover page",
          "2. Clicks CTA to delivery app",
          "3. Browses products and adds to cart",
          "4. Completes checkout process",
          "5. Views post-checkout confirmation",
          "6. Analytics and attribution recorded"
        ]
      }
    },
    database: {
      title: "Database Architecture",
      icon: Database,
      content: {
        purpose: "Relational database structure supporting the entire customer flow and affiliate management system.",
        keyTables: {
          "cover_pages": "Landing page configurations and content",
          "delivery_app_variations": "Delivery app structures and settings",
          "post_checkout_screens": "Order confirmation page designs",
          "affiliates": "Partner information and commission data",
          "customer_flows": "Complete user journey definitions",
          "affiliate_flows": "Affiliate-specific flow customizations",
          "customer_orders": "Order data and tracking information",
          "affiliate_order_tracking": "Attribution and commission records"
        },
        relationships: [
          "cover_pages → customer_flows (one-to-many)",
          "delivery_app_variations → customer_flows (one-to-many)",
          "post_checkout_screens → customer_flows (one-to-many)",
          "affiliates → affiliate_flows (one-to-many)",
          "customer_flows → affiliate_flow_assignments (one-to-many)",
          "affiliates → customer_orders (tracking relationship)",
          "customer_orders → affiliate_order_tracking (one-to-one)"
        ],
        security: [
          "Row-level security (RLS) enabled on all tables",
          "Admin-only access for management operations",
          "Public read access for active content",
          "Service role permissions for system operations",
          "Audit logging for sensitive operations"
        ]
      }
    },
    apiIntegration: {
      title: "API & Integration",
      icon: Link,
      content: {
        purpose: "External service integrations and API management for enhanced functionality.",
        integrations: {
          "Shopify": [
            "Product catalog synchronization",
            "Inventory level monitoring",
            "Collection management",
            "Order fulfillment integration"
          ],
          "Supabase": [
            "Database operations",
            "File storage management",
            "Real-time subscriptions",
            "Authentication services"
          ],
          "Analytics": [
            "Google Analytics integration",
            "Custom event tracking",
            "Conversion funnel analysis",
            "Performance monitoring"
          ]
        },
        endpoints: [
          "GET /api/flows - Retrieve customer flows",
          "POST /api/orders - Create new orders",
          "GET /api/affiliates - Affiliate data access",
          "PUT /api/tracking - Update tracking data"
        ]
      }
    },
    bestPractices: {
      title: "Best Practices",
      icon: Zap,
      content: {
        purpose: "Recommended approaches for optimal system performance and user experience.",
        performance: [
          "Image optimization for fast loading",
          "Lazy loading implementation",
          "CDN usage for static assets",
          "Database query optimization",
          "Caching strategy implementation"
        ],
        ux: [
          "Mobile-first design approach",
          "Consistent branding across flows",
          "Clear call-to-action placement",
          "Minimal friction checkout process",
          "Responsive design principles"
        ],
        maintenance: [
          "Regular database cleanup",
          "Performance monitoring",
          "Security audit schedule",
          "Backup and recovery testing",
          "Documentation updates"
        ],
        optimization: [
          "A/B testing implementation",
          "Conversion rate tracking",
          "User behavior analysis",
          "Performance benchmarking",
          "Continuous improvement cycles"
        ]
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin Dashboard Documentation</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Complete guide to system configuration, management, and best practices
        </p>
      </div>

      <div className="flex-1 flex">
        <div className="w-80 border-r">
          <ScrollArea className="h-full p-4">
            <div className="space-y-2">
              {Object.entries(documentationSections).map(([key, section]) => {
                const Icon = section.icon;
                return (
                  <Button
                    key={key}
                    variant={openSections.includes(key) ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => toggleSection(key)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {section.title}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1">
          <ScrollArea className="h-full p-6">
            <div className="space-y-6">
              {Object.entries(documentationSections).map(([key, section]) => {
                if (!openSections.includes(key)) return null;
                
                const Icon = section.icon;
                return (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-primary" />
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {section.content.description && (
                        <div>
                          <h4 className="font-semibold mb-2">Description</h4>
                          <p className="text-sm text-muted-foreground">{section.content.description}</p>
                        </div>
                      )}

                      {section.content.purpose && (
                        <div>
                          <h4 className="font-semibold mb-2">Purpose</h4>
                          <p className="text-sm text-muted-foreground">{section.content.purpose}</p>
                        </div>
                      )}

                      {section.content.tables && (
                        <div>
                          <h4 className="font-semibold mb-2">Database Tables</h4>
                          <div className="flex gap-2 flex-wrap">
                            {section.content.tables.map((table: string) => (
                              <Badge key={table} variant="outline">
                                <Database className="w-3 h-3 mr-1" />
                                {table}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.content.features && (
                        <div>
                          <h4 className="font-semibold mb-2">Key Features</h4>
                          <ul className="text-sm space-y-1">
                            {section.content.features.map((feature: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {section.content.configuration && (
                        <div>
                          <h4 className="font-semibold mb-2">Configuration Options</h4>
                          <div className="space-y-3">
                            {Object.entries(section.content.configuration).map(([category, items]) => (
                              <Collapsible key={category}>
                                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary">
                                  <ChevronRight className="w-4 h-4" />
                                  {category}
                                </CollapsibleTrigger>
                                <CollapsibleContent className="ml-6 mt-2 space-y-1">
                                  {(items as string[]).map((item: string, idx: number) => (
                                    <div key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                                      {item}
                                    </div>
                                  ))}
                                </CollapsibleContent>
                              </Collapsible>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.content.workflow && (
                        <div>
                          <h4 className="font-semibold mb-2">Workflow Steps</h4>
                          <ol className="text-sm space-y-1">
                            {section.content.workflow.map((step: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-primary font-mono text-xs mt-0.5">{idx + 1}.</span>
                                {step.replace(/^\d+\.\s*/, '')}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {section.content.journey && (
                        <div>
                          <h4 className="font-semibold mb-2">Customer Journey</h4>
                          <ol className="text-sm space-y-1">
                            {section.content.journey.map((step: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-primary font-mono text-xs mt-0.5">{idx + 1}.</span>
                                {step.replace(/^\d+\.\s*/, '')}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {section.content.themes && (
                        <div>
                          <h4 className="font-semibold mb-2">Available Themes</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(section.content.themes).map(([theme, description]) => (
                              <div key={theme} className="border rounded p-2">
                                <div className="font-medium text-sm">{theme}</div>
                                <div className="text-xs text-muted-foreground">{description}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.content.keyTables && (
                        <div>
                          <h4 className="font-semibold mb-2">Key Tables</h4>
                          <div className="space-y-2">
                            {Object.entries(section.content.keyTables).map(([table, description]) => (
                              <div key={table} className="border rounded p-3">
                                <div className="font-medium text-sm flex items-center gap-2">
                                  <Database className="w-4 h-4 text-primary" />
                                  {table}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">{description}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.content.relationships && (
                        <div>
                          <h4 className="font-semibold mb-2">Table Relationships</h4>
                          <ul className="text-sm space-y-1">
                            {section.content.relationships.map((rel: string, idx: number) => (
                              <li key={idx} className="flex items-center gap-2 font-mono text-xs">
                                <Code className="w-3 h-3 text-primary" />
                                {rel}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {section.content.integrations && (
                        <div>
                          <h4 className="font-semibold mb-2">Integrations</h4>
                          <div className="space-y-3">
                            {Object.entries(section.content.integrations).map(([service, features]) => (
                              <div key={service} className="border rounded p-3">
                                <div className="font-medium text-sm flex items-center gap-2 mb-2">
                                  <Globe className="w-4 h-4 text-primary" />
                                  {service}
                                </div>
                                <ul className="text-xs space-y-1">
                                  {(features as string[]).map((feature: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <div className="w-1 h-1 bg-muted-foreground rounded-full mt-1.5 flex-shrink-0" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.content.components && (
                        <div>
                          <h4 className="font-semibold mb-2">System Components</h4>
                          <ul className="text-sm space-y-1">
                            {section.content.components.map((component: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                                {component}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {(section.content.performance || section.content.ux || section.content.maintenance || section.content.optimization) && (
                        <div className="space-y-4">
                          {section.content.performance && (
                            <div>
                              <h4 className="font-semibold mb-2">Performance</h4>
                              <ul className="text-sm space-y-1">
                                {section.content.performance.map((item: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {section.content.ux && (
                            <div>
                              <h4 className="font-semibold mb-2">User Experience</h4>
                              <ul className="text-sm space-y-1">
                                {section.content.ux.map((item: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {section.content.maintenance && (
                            <div>
                              <h4 className="font-semibold mb-2">Maintenance</h4>
                              <ul className="text-sm space-y-1">
                                {section.content.maintenance.map((item: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <div className="w-1 h-1 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {section.content.optimization && (
                            <div>
                              <h4 className="font-semibold mb-2">Optimization</h4>
                              <ul className="text-sm space-y-1">
                                {section.content.optimization.map((item: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <div className="w-1 h-1 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};