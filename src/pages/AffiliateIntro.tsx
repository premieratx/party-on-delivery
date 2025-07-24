import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AffiliateSignup } from '@/components/affiliate/AffiliateSignup';
import { Users, DollarSign, TrendingUp, Gift } from 'lucide-react';
import logoImage from '@/assets/party-on-delivery-logo.png';

export const AffiliateIntro: React.FC = () => {
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src={logoImage} 
            alt="Party On Delivery Logo" 
            className="w-32 h-32 mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-brand-blue mb-2">
            Affiliate Program
          </h1>
          <p className="text-xl text-muted-foreground">
            Partner with Austin's Best Alcohol Delivery Service
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <CardHeader>
              <DollarSign className="w-12 h-12 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">5% Commission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Start earning 5% on every sale you refer
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="w-12 h-12 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Tiered Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                7.5% at $10k sales, 10% at $20k sales
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Free Shipping</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your customers get automatic free delivery
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Gift className="w-12 h-12 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Boat Party</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Free boat party when you hit $20k in sales!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main CTA */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to Start Earning?</CardTitle>
            <p className="text-muted-foreground">
              Join our affiliate program and start earning commissions on every sale you refer. 
              Get your own branded landing page and track your progress in real-time.
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => setShowSignup(true)}
              size="lg"
              className="w-full max-w-sm"
            >
              Sign Up as Affiliate
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Already have an account? <a href="/affiliate/login" className="text-primary hover:underline">Sign in here</a>
            </p>
          </CardContent>
        </Card>

        {/* How it Works */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Sign Up</h3>
              <p className="text-sm text-muted-foreground">
                Create your affiliate account with Google OAuth in seconds
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Get Your Link</h3>
              <p className="text-sm text-muted-foreground">
                Receive your branded landing page and unique tracking link
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Start Earning</h3>
              <p className="text-sm text-muted-foreground">
                Share your link and earn commissions on every sale
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Signup Modal */}
      <Dialog open={showSignup} onOpenChange={setShowSignup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Join Our Affiliate Program</DialogTitle>
          </DialogHeader>
          <AffiliateSignup onSuccess={() => setShowSignup(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};