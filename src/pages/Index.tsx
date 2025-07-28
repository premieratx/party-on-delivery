import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Crown, Users, Building2, Star, ArrowRight, Phone, Mail, MapPin } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Crown className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Concierge Elite</h1>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => navigate('/chat-party-planner')}
          >
            Party Planner
          </Button>
          <Button 
            variant="ghost"
            onClick={() => navigate('/admin')}
          >
            Admin
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-bold text-foreground mb-6 tracking-tight">
              Elevate Your 
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"> Lifestyle</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Premium concierge services for discerning clients and corporate partnerships. 
              Experience luxury, convenience, and excellence at every touchpoint.
            </p>
          </div>

          {/* Service Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <Card className="group p-8 hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">Personal Services</h3>
                <p className="text-muted-foreground leading-relaxed">
                  From daily errands to exclusive experiences, we handle life's details so you can focus on what matters most.
                </p>
              </div>
            </Card>

            <Card className="group p-8 hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">Corporate Solutions</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Comprehensive corporate concierge programs that enhance employee satisfaction and productivity.
                </p>
              </div>
            </Card>

            <Card className="group p-8 hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">Luxury Experiences</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Curated access to exclusive events, premium dining, travel arrangements, and bespoke experiences.
                </p>
              </div>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="inline-block p-12 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <h3 className="text-3xl font-bold mb-6 text-foreground">Ready to Experience Excellence?</h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Join our exclusive network of clients who trust us with their most important needs.
              </p>
              <Button size="lg" className="group">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          </div>
        </div>

        {/* Contact Footer */}
        <footer className="bg-slate-900 text-white mt-20">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="flex items-center justify-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <span>24/7 Concierge Line</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <span>Premium Support</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Global Network</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;