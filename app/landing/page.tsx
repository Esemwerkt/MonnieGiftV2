'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Mail, Euro, MessageSquare, CreditCard, User, ArrowRight, Shield, Zap, Heart, Star, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-3 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Logo and Title */}
            <div className="flex items-center justify-center mb-8">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <Gift className="h-16 w-16 text-primary" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Stuur Geld
              <span className="block text-primary">Cadeaus</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Veilig en eenvoudig geld cadeaus versturen via e-mail. 
              De ontvanger krijgt een speciale code om hun cadeau op te halen.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16">
              <button
                onClick={() => router.push('/login')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-3 rounded-lg font-medium transition-colors flex items-center group"
              >
                Start met Cadeaus Verzenden
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => router.push('/login')}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 text-lg px-8 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                <User className="mr-2 h-5 w-5" />
                Inloggen
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <div className="text-muted-foreground">Veilig</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-muted-foreground">Beschikbaar</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">Instant</div>
                <div className="text-muted-foreground">Verzending</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-card/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-3 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Waarom MonnieGift?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              De eenvoudigste en veiligste manier om geld cadeaus te versturen
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-3">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Veilig</h3>
              <p className="text-muted-foreground">
                Aangedreven door Stripe Connect voor maximale beveiliging
              </p>
            </div>

            <div className="text-center p-3">
              <div className="bg-chart-1/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-chart-1" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Snel</h3>
              <p className="text-muted-foreground">
                Directe overboekingen zonder wachttijden
              </p>
            </div>

            <div className="text-center p-3">
              <div className="bg-chart-2/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-chart-2" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Eenvoudig</h3>
              <p className="text-muted-foreground">
                E-mail authenticatie, geen complexe accounts nodig
              </p>
            </div>

            <div className="text-center p-3">
              <div className="bg-chart-3/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-chart-3" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Persoonlijk</h3>
              <p className="text-muted-foreground">
                Voeg persoonlijke berichten toe aan je cadeaus
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-3 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Hoe Het Werkt
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              In 4 eenvoudige stappen je eerste geld cadeau versturen
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Maak Account</h3>
              <p className="text-muted-foreground">
                Registreer je gratis en krijg toegang tot je dashboard
              </p>
            </div>

            <div className="text-center">
              <div className="bg-chart-1 text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Stuur Cadeau</h3>
              <p className="text-muted-foreground">
                Voer bedrag en e-mail in, voeg een persoonlijk bericht toe
              </p>
            </div>

            <div className="text-center">
              <div className="bg-chart-2 text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Betaal Veilig</h3>
              <p className="text-muted-foreground">
                Betaal via Stripe met je creditcard of bankrekening
              </p>
            </div>

            <div className="text-center">
              <div className="bg-chart-3 text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                4
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Ontvanger Haalt Op</h3>
              <p className="text-muted-foreground">
                Ontvanger krijgt e-mail met code om geld op te halen
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-primary/5">
        <div className=" mx-auto text-center px-3 sm:px-3 lg:px-8">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Klaar om te Beginnen?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Sluit je aan bij duizenden gebruikers die al geld cadeaus versturen
          </p>
          <button
            onClick={() => router.push('/login')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-3 rounded-lg font-medium transition-colors flex items-center mx-auto group"
          >
            Start Nu Gratis
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="py-12 border-t ">
        <div className="max-w-7xl mx-auto px-3 sm:px-3 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Gift className="h-8 w-8 text-primary mr-3" />
              <span className="text-2xl font-bold text-foreground">MonnieGift</span>
            </div>
            <p className="text-muted-foreground">
              Veilig geld cadeaus versturen via e-mail
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
