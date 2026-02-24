import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Sun, Moon, Menu, X, TrendingDown, Zap, Target, Bell, BarChart3, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { EmailCapturePopup } from '../components/EmailCapturePopup';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TELEGRAM_LINK = 'https://t.me/hubtest123';

// Deal data for ticker
const deals = [
  { category: "WATCHES", name: "Grand Seiko Snowflake", price: "$4,745", market: "$5,500", savings: "13.7% below target", hot: true },
  { category: "SNEAKERS", name: "Nike Dunk Low Panda", price: "$85", market: "$110", savings: "23% below retail", hot: true },
  { category: "WATCHES", name: "Tudor Black Bay 58", price: "$3,250", market: "$3,800", savings: "14.5% below market", hot: true },
  { category: "CARS", name: "1992 Mazda Miata NA", price: "$12,800", market: "$16,000", savings: "20% under comps", hot: false },
  { category: "SNEAKERS", name: "New Balance 990v6", price: "$142", market: "$199", savings: "29% off retail", hot: true },
  { category: "WATCHES", name: "Omega Speedmaster Reduced", price: "$3,100", market: "$3,600", savings: "14% below average", hot: false },
  { category: "MEMORABILIA", name: "PSA 10 Jeter Rookie", price: "$385", market: "$520", savings: "26% below recent sale", hot: true },
  { category: "CARS", name: "2006 Porsche Cayman S", price: "$28,500", market: "$34,000", savings: "16% under market", hot: false },
];

const LandingClean: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'landing-clean',
          subscribed_at: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to subscribe' }));
        if (response.status === 409 || errorData.message?.includes('already')) {
          toast.error('This email is already subscribed!');
          return;
        }
        throw new Error(errorData.message || 'Failed to subscribe');
      }

      toast.success('🎉 Subscribed! Check your email.');
      setEmail('');
    } catch (error) {
      console.error('Newsletter signup error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Email Capture Popup */}
      <EmailCapturePopup delayMs={5000} />
      
      <Helmet>
        <title>The Hub — Never Overpay Again</title>
        <meta name="description" content="The Hub tracks prices across watches, sneakers, cars, and memorabilia — and alerts you the moment a deal drops below your target." />
        <meta property="og:title" content="The Hub — Never Overpay Again" />
        <meta property="og:description" content="Track prices across watches, sneakers, cars & collectibles. Get instant alerts when deals drop below your target." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://thehubdeals.com" />
      </Helmet>

      <div className={`min-h-screen font-['DM_Sans'] transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-[#0a0a0a] text-[#f0f0f0]' 
          : 'bg-white text-[#0a0a0a]'
      }`}>
        {/* Navigation */}
        <nav className={`fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-5 flex justify-between items-center transition-colors duration-300 backdrop-blur-xl ${
          theme === 'dark'
            ? 'bg-[rgba(10,10,10,0.92)] border-b border-[rgba(255,255,255,0.08)]'
            : 'bg-[rgba(255,255,255,0.92)] border-b border-[#e5e3df]'
        }`}>
          <a href="/" className="text-xl font-bold tracking-tight" style={{ textDecoration: 'none', color: 'inherit' }}>The Hub</a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('how')}
              className={`text-sm font-medium transition-colors ${
                theme === 'dark' ? 'text-[#888] hover:text-[#f0f0f0]' : 'text-[#6b6763] hover:text-[#0a0a0a]'
              }`}
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('categories')}
              className={`text-sm font-medium transition-colors ${
                theme === 'dark' ? 'text-[#888] hover:text-[#f0f0f0]' : 'text-[#6b6763] hover:text-[#0a0a0a]'
              }`}
            >
              Categories
            </button>
            <button 
              onClick={() => scrollToSection('channels')}
              className={`text-sm font-medium transition-colors ${
                theme === 'dark' ? 'text-[#888] hover:text-[#f0f0f0]' : 'text-[#6b6763] hover:text-[#0a0a0a]'
              }`}
            >
              Alerts
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 px-3 rounded-lg border transition-all flex items-center justify-center ${
                theme === 'dark'
                  ? 'border-[rgba(255,255,255,0.08)] hover:border-[#f0f0f0]'
                  : 'border-[#e5e3df] hover:border-[#0a0a0a]'
              }`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              to="/signup"
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-[#f0f0f0] text-[#0a0a0a] hover:opacity-90'
                  : 'bg-[#1a1a1a] text-white hover:opacity-90'
              }`}
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`fixed top-[65px] left-0 right-0 z-40 px-6 py-5 md:hidden transition-colors ${
            theme === 'dark' ? 'bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.08)]' : 'bg-white border-b border-[#e5e3df]'
          }`}>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => scrollToSection('how')}
                className={`text-sm font-medium text-left py-3 border-b transition-colors ${
                  theme === 'dark' 
                    ? 'text-[#888] hover:text-[#f0f0f0] border-[rgba(255,255,255,0.08)]' 
                    : 'text-[#6b6763] hover:text-[#0a0a0a] border-[#e5e3df]'
                }`}
              >
                How It Works
              </button>
              <button 
                onClick={() => scrollToSection('categories')}
                className={`text-sm font-medium text-left py-3 border-b transition-colors ${
                  theme === 'dark' 
                    ? 'text-[#888] hover:text-[#f0f0f0] border-[rgba(255,255,255,0.08)]' 
                    : 'text-[#6b6763] hover:text-[#0a0a0a] border-[#e5e3df]'
                }`}
              >
                Categories
              </button>
              <button 
                onClick={() => scrollToSection('channels')}
                className={`text-sm font-medium text-left py-3 transition-colors ${
                  theme === 'dark' ? 'text-[#888] hover:text-[#f0f0f0]' : 'text-[#6b6763] hover:text-[#0a0a0a]'
                }`}
              >
                Alerts
              </button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="pt-40 pb-20 px-6 lg:px-12 max-w-[1200px] mx-auto text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 ${
            theme === 'dark' 
              ? 'bg-[rgba(26,141,95,0.15)] text-[#1a8d5f]' 
              : 'bg-[#e8f5ee] text-[#1a8d5f]'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1a8d5f] animate-pulse"></span>
            <span className="text-[13px] font-semibold">Live — tracking 4 items right now</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-[-2px] mb-6">
            Never overpay<br />for what you collect.
          </h1>

          <p className={`text-lg leading-relaxed max-w-[560px] mx-auto mb-10 ${
            theme === 'dark' ? 'text-[#888]' : 'text-[#6b6763]'
          }`}>
            The Hub tracks prices across watches, sneakers, cars, and memorabilia — and alerts you the moment a deal drops below your target.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-[#f0f0f0] text-[#0a0a0a] hover:opacity-90 hover:-translate-y-0.5'
                  : 'bg-[#1a1a1a] text-white hover:opacity-90 hover:-translate-y-0.5'
              }`}
            >
              Start Tracking Free
            </Link>
            <button
              onClick={() => scrollToSection('how')}
              className={`px-6 py-3 rounded-lg text-sm font-semibold border transition-all ${
                theme === 'dark'
                  ? 'bg-[#0a0a0a] text-[#f0f0f0] border-[rgba(255,255,255,0.08)] hover:border-[#f0f0f0]'
                  : 'bg-white text-[#0a0a0a] border-[#e5e3df] hover:border-[#0a0a0a]'
              }`}
            >
              See How It Works
            </button>
          </div>
        </section>

        {/* Social Proof Stats */}
        <section className={`py-10 px-6 text-center border-t transition-colors ${
          theme === 'dark' ? 'border-[rgba(255,255,255,0.08)]' : 'border-[#e5e3df]'
        }`}>
          <div className="max-w-[900px] mx-auto grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-15">
            <div>
              <div className="font-['Space_Mono'] text-3xl font-bold tracking-tight mb-1">1,700+</div>
              <div className={`text-[13px] uppercase tracking-wider font-semibold ${
                theme === 'dark' ? 'text-[#888]' : 'text-[#6b6763]'
              }`}>Listings Tracked</div>
            </div>
            <div>
              <div className="font-['Space_Mono'] text-3xl font-bold tracking-tight mb-1">4</div>
              <div className={`text-[13px] uppercase tracking-wider font-semibold ${
                theme === 'dark' ? 'text-[#888]' : 'text-[#6b6763]'
              }`}>Markets Monitored</div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="font-['Space_Mono'] text-3xl font-bold tracking-tight mb-1">24/7</div>
              <div className={`text-[13px] uppercase tracking-wider font-semibold ${
                theme === 'dark' ? 'text-[#888]' : 'text-[#6b6763]'
              }`}>Real-Time Alerts</div>
            </div>
          </div>
        </section>

        {/* Live Deals Ticker */}
        <section className={`py-10 overflow-hidden border-t transition-colors ${
          theme === 'dark' 
            ? 'bg-[#0f0f0f] border-[rgba(255,255,255,0.08)]' 
            : 'bg-[#f8f7f5] border-[#e5e3df]'
        }`}>
          <div className={`text-[11px] font-semibold tracking-[2px] uppercase text-center mb-5 ${
            theme === 'dark' ? 'text-[#888]' : 'text-[#a8a5a0]'
          }`}>
            Live Deals — Updated Continuously
          </div>
          <div className="flex gap-6 animate-scroll whitespace-nowrap">
            {[...deals, ...deals].map((deal, idx) => (
              <div
                key={idx}
                className={`min-w-[300px] p-5 px-6 rounded-xl border flex-shrink-0 transition-all ${
                  theme === 'dark'
                    ? 'bg-[#141414] border-[rgba(255,255,255,0.08)] hover:border-[#888]'
                    : 'bg-white border-[#e5e3df] hover:border-[#a8a5a0]'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[11px] font-semibold tracking-wider uppercase ${
                    theme === 'dark' ? 'text-[#888]' : 'text-[#a8a5a0]'
                  }`}>
                    {deal.category}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                    deal.hot 
                      ? 'bg-[#1a8d5f] text-white' 
                      : theme === 'dark'
                        ? 'bg-[rgba(255,152,0,0.2)] text-[#FF9800]'
                        : 'bg-[rgba(255,152,0,0.15)] text-[#FF9800]'
                  }`}>
                    {deal.hot ? 'HOT DEAL' : 'GOOD DEAL'}
                  </span>
                </div>
                <div className="text-base font-semibold tracking-tight mb-2">{deal.name}</div>
                <div className="flex items-baseline gap-2.5 mb-1">
                  <span className="font-['Space_Mono'] text-xl font-bold">{deal.price}</span>
                  <span className={`font-['Space_Mono'] text-sm line-through ${
                    theme === 'dark' ? 'text-[#888]' : 'text-[#a8a5a0]'
                  }`}>
                    {deal.market}
                  </span>
                </div>
                <div className="text-[13px] font-semibold text-[#1a8d5f]">↓ {deal.savings}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="how" className="py-25 px-6 lg:px-12 max-w-[1200px] mx-auto">
          <div className={`text-xs font-semibold tracking-[2px] uppercase mb-4 ${
            theme === 'dark' ? 'text-[#888]' : 'text-[#a8a5a0]'
          }`}>
            How It Works
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-15">
            Set your target. We do the rest.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: '01',
                title: 'Tell us what you want',
                description: 'Add any watch, sneaker, car, or collectible to your watchlist. Set the price you\'re willing to pay.'
              },
              {
                number: '02',
                title: 'We scan everything',
                description: 'Our agents monitor Chrono24, eBay, StockX, dealer sites, and more — 24/7, so you don\'t have to.'
              },
              {
                number: '03',
                title: 'Get alerted instantly',
                description: 'Price drops below your target? You\'ll know within minutes via Telegram, email, or right on your dashboard.'
              }
            ].map((step) => (
              <div
                key={step.number}
                className={`p-8 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl ${
                  theme === 'dark'
                    ? 'border-[rgba(255,255,255,0.08)] hover:border-[#f0f0f0] hover:shadow-[rgba(255,255,255,0.03)]'
                    : 'bg-white border-[#e5e3df] hover:border-[#0a0a0a] hover:shadow-[rgba(0,0,0,0.06)]'
                }`}
              >
                <div className={`font-['Space_Mono'] text-5xl font-bold leading-none mb-5 ${
                  theme === 'dark' ? 'text-[rgba(255,255,255,0.08)]' : 'text-[#e5e3df]'
                }`}>
                  {step.number}
                </div>
                <h3 className="text-lg font-bold tracking-tight mb-3">{step.title}</h3>
                <p className={`text-[15px] leading-relaxed ${
                  theme === 'dark' ? 'text-[#888]' : 'text-[#6b6763]'
                }`}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section id="categories" className={`py-25 px-6 lg:px-12 transition-colors ${
          theme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-[#f8f7f5]'
        }`}>
          <div className="max-w-[1200px] mx-auto">
            <div className={`text-xs font-semibold tracking-[2px] uppercase mb-4 ${
              theme === 'dark' ? 'text-[#888]' : 'text-[#a8a5a0]'
            }`}>
              What We Track
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-15">
              Four markets. One dashboard.
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: '⌚', title: 'Watches', description: 'Rolex, Grand Seiko, Tudor, Omega — tracked across Chrono24, eBay, and authorized dealers.' },
                { icon: '👟', title: 'Sneakers', description: 'Nike Dunks, Jordans, New Balance collabs — prices from StockX, GOAT, and retail drops.' },
                { icon: '🚗', title: 'Cars', description: 'Classic muscle, JDM legends, modern collectibles — auctions and private sales monitored.' },
                { icon: '🏆', title: 'Sports & Memorabilia', description: 'Cards, signed gear, game-worn items — tracked across auction houses and marketplaces.' }
              ].map((cat) => (
                <div
                  key={cat.title}
                  className={`p-9 px-7 rounded-2xl border text-center transition-all cursor-pointer hover:-translate-y-1 hover:shadow-xl ${
                    theme === 'dark'
                      ? 'bg-[#141414] border-[rgba(255,255,255,0.08)] hover:border-[#f0f0f0] hover:shadow-[rgba(255,255,255,0.03)]'
                      : 'bg-white border-[#e5e3df] hover:border-[#0a0a0a] hover:shadow-[rgba(0,0,0,0.06)]'
                  }`}
                >
                  <div className="text-4xl mb-4">{cat.icon}</div>
                  <h3 className="text-lg font-bold tracking-tight mb-2">{cat.title}</h3>
                  <p className={`text-sm leading-relaxed ${
                    theme === 'dark' ? 'text-[#888]' : 'text-[#6b6763]'
                  }`}>
                    {cat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Real Deal Example */}
        <section className="py-25 px-6 lg:px-12 max-w-[1200px] mx-auto">
          <div className={`text-xs font-semibold tracking-[2px] uppercase mb-4 ${
            theme === 'dark' ? 'text-[#888]' : 'text-[#a8a5a0]'
          }`}>
            Real Deal
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-15">
            This is what it looks like.
          </h2>
          <div className={`p-12 rounded-3xl border grid md:grid-cols-2 gap-15 items-center transition-colors ${
            theme === 'dark'
              ? 'bg-[#141414] border-[rgba(255,255,255,0.08)]'
              : 'bg-white border-[#e5e3df]'
          }`}>
            <div>
              <h3 className="text-sm font-semibold text-[#1a8d5f] mb-3 uppercase tracking-wide">
                🔴 Hot Deal Alert
              </h3>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Grand Seiko Snowflake</h2>
              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-[#888]' : 'text-[#a8a5a0]'}`}>
                Found on Chrono24
              </p>
              <div className="flex gap-10 mb-6">
                <div>
                  <label className={`text-xs uppercase tracking-wide font-semibold block mb-1 ${
                    theme === 'dark' ? 'text-[#888]' : 'text-[#a8a5a0]'
                  }`}>
                    Deal Price
                  </label>
                  <div className="font-['Space_Mono'] text-3xl font-bold">$4,745</div>
                </div>
                <div>
                  <label className={`text-xs uppercase tracking-wide font-semibold block mb-1 ${
                    theme === 'dark' ? 'text-[#888]' : 'text-[#a8a5a0]'
                  }`}>
                    Target Price
                  </label>
                  <div className={`font-['Space_Mono'] text-2xl font-bold line-through ${
                    theme === 'dark' ? 'text-[#888]' : 'text-[#a8a5a0]'
                  }`}>
                    $5,500
                  </div>
                </div>
              </div>
              <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-lg text-[#1a8d5f] font-bold text-[15px] ${
                theme === 'dark' ? 'bg-[rgba(26,141,95,0.15)]' : 'bg-[#e8f5ee]'
              }`}>
                ↓ 13.7% below your target — $755 saved
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { icon: '🎯', title: 'Your price, your rules', description: 'You set $5,500 as your max. We found it at $4,745. You decide if it\'s the one.' },
                { icon: '⚡', title: 'Alerted in minutes', description: 'The moment this listing hit Chrono24 below your target, your phone buzzed.' },
                { icon: '📊', title: 'Price context included', description: 'See how the deal compares to recent sales, market average, and your target — all in one view.' },
                { icon: '🔗', title: 'Direct link to listing', description: 'One tap from the alert takes you straight to the seller. No middleman.' }
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-4 py-4 ${
                    idx < 3 ? `border-b ${theme === 'dark' ? 'border-[#141414]' : 'border-[#f2f1ef]'}` : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-colors ${
                    theme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-[#f8f7f5]'
                  }`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold mb-0.5">{feature.title}</h4>
                    <p className={`text-[13px] leading-relaxed ${
                      theme === 'dark' ? 'text-[#888]' : 'text-[#6b6763]'
                    }`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Channels */}
        <section id="channels" className={`py-25 px-6 lg:px-12 transition-colors ${
          theme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-[#f8f7f5]'
        }`}>
          <div className="max-w-[1200px] mx-auto">
            <div className={`text-xs font-semibold tracking-[2px] uppercase mb-4 ${
              theme === 'dark' ? 'text-[#888]' : 'text-[#a8a5a0]'
            }`}>
              Stay Connected
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-15">
              Get deals where you already are.
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: '✈️', title: 'Telegram', description: 'Real-time deal alerts the second they drop. For collectors who move fast.', link: TELEGRAM_LINK, external: true },
                { icon: '📸', title: 'Instagram', description: 'Daily deal highlights, price drops, and finds you won\'t see anywhere else.', link: 'https://instagram.com/thehubdeals', external: true },
                { icon: '🖥️', title: 'Dashboard', description: 'Your personal command center. Track watchlists, set targets, review price history.', link: '/signup', external: false }
              ].map((channel) => (
                <div
                  key={channel.title}
                  className={`p-8 rounded-2xl border text-center transition-all hover:-translate-y-1 hover:shadow-xl ${
                    theme === 'dark'
                      ? 'bg-[#141414] border-[rgba(255,255,255,0.08)] hover:border-[#f0f0f0] hover:shadow-[rgba(255,255,255,0.03)]'
                      : 'bg-white border-[#e5e3df] hover:border-[#0a0a0a] hover:shadow-[rgba(0,0,0,0.06)]'
                  }`}
                >
                  <div className="text-4xl mb-4">{channel.icon}</div>
                  <h3 className="text-lg font-bold mb-2">{channel.title}</h3>
                  <p className={`text-sm leading-relaxed mb-5 ${
                    theme === 'dark' ? 'text-[#888]' : 'text-[#6b6763]'
                  }`}>
                    {channel.description}
                  </p>
                  {channel.external ? (
                    <a
                      href={channel.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        theme === 'dark'
                          ? 'bg-[#f0f0f0] text-[#0a0a0a] hover:opacity-90'
                          : 'bg-[#1a1a1a] text-white hover:opacity-90'
                      }`}
                    >
                      {channel.title === 'Telegram' ? 'Join Channel' : channel.title === 'Instagram' ? 'Follow @thehubdeals' : 'Visit'}
                    </a>
                  ) : (
                    <Link
                      to={channel.link}
                      className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        theme === 'dark'
                          ? 'bg-[#f0f0f0] text-[#0a0a0a] hover:opacity-90'
                          : 'bg-[#1a1a1a] text-white hover:opacity-90'
                      }`}
                    >
                      Sign Up Free
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-25 px-6 lg:px-12 max-w-[1200px] mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Stop browsing.<br />Start tracking.
          </h2>
          <p className={`text-lg mb-9 max-w-[480px] mx-auto ${
            theme === 'dark' ? 'text-[#888]' : 'text-[#6b6763]'
          }`}>
            Join collectors who let The Hub do the hunting. Set your targets and we'll tell you when it's time to buy.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Link
              to="/signup"
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-[#f0f0f0] text-[#0a0a0a] hover:opacity-90'
                  : 'bg-[#1a1a1a] text-white hover:opacity-90'
              }`}
            >
              Get Started Free
            </Link>
            <a
              href={TELEGRAM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-6 py-3 rounded-lg text-sm font-semibold border transition-all ${
                theme === 'dark'
                  ? 'bg-[#0a0a0a] text-[#f0f0f0] border-[rgba(255,255,255,0.08)] hover:border-[#f0f0f0]'
                  : 'bg-white text-[#0a0a0a] border-[#e5e3df] hover:border-[#0a0a0a]'
              }`}
            >
              Join Telegram
            </a>
          </div>
          <p className={`text-[13px] ${theme === 'dark' ? 'text-[#888]' : 'text-[#a8a5a0]'}`}>
            Free to use. No credit card required.
          </p>
        </section>

        {/* Footer */}
        <footer className={`py-10 px-6 lg:px-12 border-t transition-colors ${
          theme === 'dark' ? 'border-[rgba(255,255,255,0.08)]' : 'border-[#e5e3df]'
        }`}>
          <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <p className={`text-[13px] ${theme === 'dark' ? 'text-[#888]' : 'text-[#a8a5a0]'}`}>
              © 2026 The Hub. Built for collectors, by collectors.
            </p>
            <div className="flex gap-6">
              {[
                { label: 'Telegram', link: TELEGRAM_LINK },
                { label: 'Instagram', link: 'https://instagram.com/thehubdeals' },
                { label: 'Discord', link: '#' },
                { label: 'Blog', link: '/blog' }
              ].map((item) => (
                item.link.startsWith('http') ? (
                  <a
                    key={item.label}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-[13px] transition-colors ${
                      theme === 'dark' ? 'text-[#888] hover:text-[#f0f0f0]' : 'text-[#a8a5a0] hover:text-[#0a0a0a]'
                    }`}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    to={item.link}
                    className={`text-[13px] transition-colors ${
                      theme === 'dark' ? 'text-[#888] hover:text-[#f0f0f0]' : 'text-[#a8a5a0] hover:text-[#0a0a0a]'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </>
  );
};

export default LandingClean;
