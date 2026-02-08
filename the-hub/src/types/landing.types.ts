// Landing Page Type Definitions

export interface DealCard {
  id: string;
  title: string;
  brand: string;
  image: string;
  originalPrice: number;
  currentPrice: number;
  discount: number;
  category: 'watch' | 'sneaker' | 'car' | 'sports';
  source: string;
  timestamp: Date;
}

export interface PainPoint {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
  icon: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  content: string;
  rating: number;
}

export interface Stat {
  id: string;
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface EmailSignupData {
  email: string;
  source: string;
  timestamp: Date;
}
