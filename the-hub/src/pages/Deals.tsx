/**
 * Programmatic SEO Deal Pages
 * Dynamic pages for brand/category specific deals
 * e.g., /deals/rolex, /deals/nike, /deals/porsche
 */

import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { TrendingUp, Clock, Bell, ExternalLink, Filter, ChevronRight } from 'lucide-react';
import EmailCaptureHero from '../components/newsletter/EmailCaptureHero';

// Brand/category definitions for SEO
const brandData: Record<string, {
  name: string;
  category: 'watches' | 'sneakers' | 'cars';
  description: string;
  longDescription: string;
  keywords: string[];
  relatedBrands: string[];
  avgSavings: string;
  dealFrequency: string;
  image?: string;
}> = {
  // WATCHES
  'rolex': {
    name: 'Rolex',
    category: 'watches',
    description: 'Find Rolex watches below market value. Real-time alerts for Submariner, Daytona, GMT-Master, and more.',
    longDescription: 'The Hub monitors 50+ sources 24/7 to find underpriced Rolex watches. Whether you\'re looking for a Submariner, Daytona, GMT-Master II, or Datejust, we alert you the moment a deal appears — before it sells out.',
    keywords: ['rolex deals', 'cheap rolex', 'rolex below retail', 'rolex submariner deals', 'rolex daytona deals'],
    relatedBrands: ['omega', 'tudor', 'patek-philippe', 'audemars-piguet'],
    avgSavings: '$2,000 - $15,000',
    dealFrequency: '3-5 deals/week',
  },
  'omega': {
    name: 'Omega',
    category: 'watches',
    description: 'Omega watch deals and alerts. Find Speedmaster, Seamaster, and Aqua Terra below market price.',
    longDescription: 'Track Omega deals across the secondary market. We find underpriced Speedmasters, Seamasters, and Planet Oceans so you can buy before other collectors.',
    keywords: ['omega deals', 'omega speedmaster deals', 'omega seamaster deals', 'cheap omega'],
    relatedBrands: ['rolex', 'tudor', 'breitling', 'tag-heuer'],
    avgSavings: '$500 - $3,000',
    dealFrequency: '5-10 deals/week',
  },
  'tudor': {
    name: 'Tudor',
    category: 'watches',
    description: 'Tudor watch deals. Black Bay, Pelagos, and more at below-market prices.',
    longDescription: 'Tudor offers Rolex quality at lower prices — and we help you find them even cheaper. Get alerts for Black Bay, Pelagos, and other Tudor deals.',
    keywords: ['tudor deals', 'tudor black bay deals', 'tudor pelagos deals', 'cheap tudor'],
    relatedBrands: ['rolex', 'omega', 'tag-heuer', 'longines'],
    avgSavings: '$300 - $1,500',
    dealFrequency: '8-12 deals/week',
  },
  'patek-philippe': {
    name: 'Patek Philippe',
    category: 'watches',
    description: 'Patek Philippe deals and alerts. Find Nautilus, Aquanaut, and Calatrava below market.',
    longDescription: 'Patek Philippe rarely goes on sale — but mispriced listings happen. We monitor the market 24/7 to catch them when they do.',
    keywords: ['patek philippe deals', 'patek nautilus deals', 'cheap patek', 'patek below retail'],
    relatedBrands: ['rolex', 'audemars-piguet', 'vacheron-constantin', 'a-lange-sohne'],
    avgSavings: '$5,000 - $50,000',
    dealFrequency: '1-2 deals/week',
  },
  'audemars-piguet': {
    name: 'Audemars Piguet',
    category: 'watches',
    description: 'AP Royal Oak and offshore deals. Find Audemars Piguet watches below market value.',
    longDescription: 'Royal Oak prices have been volatile — that means opportunities. We track AP listings across all major platforms to find the best deals.',
    keywords: ['audemars piguet deals', 'ap royal oak deals', 'cheap royal oak', 'ap offshore deals'],
    relatedBrands: ['patek-philippe', 'rolex', 'vacheron-constantin', 'hublot'],
    avgSavings: '$3,000 - $20,000',
    dealFrequency: '2-4 deals/week',
  },
  
  // SNEAKERS
  'nike': {
    name: 'Nike',
    category: 'sneakers',
    description: 'Nike sneaker deals. Find Jordan, Dunk, Air Max, and more below retail and resale.',
    longDescription: 'Whether it\'s Jordans, Dunks, or Air Force 1s, we track Nike deals across StockX, GOAT, eBay, and more. Get alerts when something drops below market.',
    keywords: ['nike deals', 'nike below retail', 'jordan deals', 'nike dunk deals', 'air max deals'],
    relatedBrands: ['jordan', 'adidas', 'new-balance', 'yeezy'],
    avgSavings: '$30 - $200',
    dealFrequency: '20-30 deals/week',
  },
  'jordan': {
    name: 'Jordan',
    category: 'sneakers',
    description: 'Air Jordan deals and restocks. Find Jordan 1, 4, 11 and more below resale.',
    longDescription: 'Jordan 1s, 4s, 11s, Travis Scotts — we track them all. Get alerts when prices dip below market so you can cop or flip.',
    keywords: ['jordan deals', 'jordan 1 deals', 'jordan 4 deals', 'travis scott jordan deals', 'cheap jordans'],
    relatedBrands: ['nike', 'yeezy', 'adidas', 'new-balance'],
    avgSavings: '$50 - $500',
    dealFrequency: '15-25 deals/week',
  },
  'yeezy': {
    name: 'Yeezy',
    category: 'sneakers',
    description: 'Yeezy deals and price drops. Find 350s, 700s, Slides and Foams below market.',
    longDescription: 'Yeezy prices fluctuate constantly. We track every listing to find when 350s, 700s, and Slides dip below market value.',
    keywords: ['yeezy deals', 'yeezy 350 deals', 'yeezy slides deals', 'cheap yeezys', 'yeezy below retail'],
    relatedBrands: ['jordan', 'nike', 'adidas', 'new-balance'],
    avgSavings: '$30 - $150',
    dealFrequency: '10-20 deals/week',
  },
  'new-balance': {
    name: 'New Balance',
    category: 'sneakers',
    description: 'New Balance deals. Find 550, 2002R, 990, and collaborations below resale.',
    longDescription: 'New Balance has exploded in popularity. We track 550s, 2002Rs, and collabs to find deals before they sell out.',
    keywords: ['new balance deals', 'nb 550 deals', 'new balance 2002r deals', 'nb 990 deals'],
    relatedBrands: ['nike', 'jordan', 'asics', 'adidas'],
    avgSavings: '$20 - $100',
    dealFrequency: '10-15 deals/week',
  },
  
  // CARS
  'porsche': {
    name: 'Porsche',
    category: 'cars',
    description: 'Porsche deals and underpriced listings. Find 911, Cayman, GT3, GT4 below market.',
    longDescription: 'We monitor Porsche listings across dealers, auctions, and private sales. When a 911, GT3, or Cayman is priced below market — you\'ll know first.',
    keywords: ['porsche deals', 'porsche 911 deals', 'porsche gt3 deals', 'cheap porsche', 'porsche below market'],
    relatedBrands: ['ferrari', 'lamborghini', 'mclaren', 'bmw-m'],
    avgSavings: '$10,000 - $50,000',
    dealFrequency: '2-5 deals/week',
  },
  'ferrari': {
    name: 'Ferrari',
    category: 'cars',
    description: 'Ferrari deals and market opportunities. Find 488, F8, Roma below market value.',
    longDescription: 'Ferrari allocation is hard to get — but the secondary market has opportunities. We find underpriced listings before they disappear.',
    keywords: ['ferrari deals', 'ferrari 488 deals', 'cheap ferrari', 'ferrari below market', 'ferrari f8 deals'],
    relatedBrands: ['porsche', 'lamborghini', 'mclaren', 'aston-martin'],
    avgSavings: '$20,000 - $100,000',
    dealFrequency: '1-2 deals/week',
  },
  'bmw-m': {
    name: 'BMW M',
    category: 'cars',
    description: 'BMW M car deals. Find M3, M4, M5, M2 below market value.',
    longDescription: 'BMW M cars depreciate — but some depreciate more than others. We find the best deals on M3s, M4s, M5s and more.',
    keywords: ['bmw m deals', 'bmw m3 deals', 'bmw m4 deals', 'cheap bmw m', 'bmw m5 deals'],
    relatedBrands: ['porsche', 'mercedes-amg', 'audi-rs', 'alfa-romeo'],
    avgSavings: '$5,000 - $20,000',
    dealFrequency: '5-10 deals/week',
  },

  // MORE WATCHES
  'breitling': {
    name: 'Breitling',
    category: 'watches',
    description: 'Breitling watch deals. Find Navitimer, Superocean, Chronomat below market.',
    longDescription: 'Breitling makes pilot watches and dive watches that hold value. We track the secondary market to find deals on Navitimers, Superoceans, and more.',
    keywords: ['breitling deals', 'breitling navitimer deals', 'breitling superocean deals', 'cheap breitling'],
    relatedBrands: ['omega', 'tag-heuer', 'iwc', 'zenith'],
    avgSavings: '$500 - $3,000',
    dealFrequency: '5-8 deals/week',
  },
  'tag-heuer': {
    name: 'TAG Heuer',
    category: 'watches',
    description: 'TAG Heuer deals. Find Carrera, Monaco, Aquaracer below market price.',
    longDescription: 'TAG Heuer offers racing heritage at accessible prices. We find the best deals on Carreras, Monacos, and Aquaracers.',
    keywords: ['tag heuer deals', 'tag heuer carrera deals', 'tag heuer monaco deals', 'cheap tag heuer'],
    relatedBrands: ['omega', 'breitling', 'longines', 'tissot'],
    avgSavings: '$300 - $1,500',
    dealFrequency: '8-12 deals/week',
  },
  'iwc': {
    name: 'IWC',
    category: 'watches',
    description: 'IWC watch deals. Find Portugieser, Pilot, and Aquatimer below market.',
    longDescription: 'IWC makes some of the best pilot watches and dress watches. We track deals on Portugiesers, Big Pilots, and more.',
    keywords: ['iwc deals', 'iwc portugieser deals', 'iwc pilot deals', 'cheap iwc'],
    relatedBrands: ['omega', 'jaeger-lecoultre', 'breitling', 'panerai'],
    avgSavings: '$1,000 - $5,000',
    dealFrequency: '3-5 deals/week',
  },
  'panerai': {
    name: 'Panerai',
    category: 'watches',
    description: 'Panerai deals. Find Luminor, Submersible, and Radiomir below market.',
    longDescription: 'Panerai\'s bold Italian dive watches have a cult following. We find deals when prices dip below market.',
    keywords: ['panerai deals', 'panerai luminor deals', 'panerai submersible deals', 'cheap panerai'],
    relatedBrands: ['omega', 'iwc', 'breitling', 'tudor'],
    avgSavings: '$1,000 - $4,000',
    dealFrequency: '4-6 deals/week',
  },
  'grand-seiko': {
    name: 'Grand Seiko',
    category: 'watches',
    description: 'Grand Seiko deals. Find Spring Drive and Hi-Beat below market value.',
    longDescription: 'Grand Seiko offers finishing that rivals Swiss brands at better prices. We track deals on Spring Drive, Hi-Beat, and limited editions.',
    keywords: ['grand seiko deals', 'grand seiko spring drive deals', 'grand seiko snowflake deals', 'cheap grand seiko'],
    relatedBrands: ['omega', 'tudor', 'longines', 'rolex'],
    avgSavings: '$500 - $2,500',
    dealFrequency: '5-8 deals/week',
  },
  'cartier': {
    name: 'Cartier',
    category: 'watches',
    description: 'Cartier watch deals. Find Santos, Tank, and Ballon Bleu below market.',
    longDescription: 'Cartier watches are icons of elegance. We find deals on Santos, Tank, Ballon Bleu, and Panthère models.',
    keywords: ['cartier watch deals', 'cartier santos deals', 'cartier tank deals', 'cheap cartier'],
    relatedBrands: ['rolex', 'omega', 'jaeger-lecoultre', 'patek-philippe'],
    avgSavings: '$1,000 - $5,000',
    dealFrequency: '3-5 deals/week',
  },
  'jaeger-lecoultre': {
    name: 'Jaeger-LeCoultre',
    category: 'watches',
    description: 'JLC watch deals. Find Reverso, Master, and Polaris below market.',
    longDescription: 'Jaeger-LeCoultre is the watchmaker\'s watchmaker. We track deals on Reversos, Master Controls, and Polaris watches.',
    keywords: ['jaeger lecoultre deals', 'jlc reverso deals', 'jlc master deals', 'cheap jaeger lecoultre'],
    relatedBrands: ['patek-philippe', 'iwc', 'omega', 'cartier'],
    avgSavings: '$2,000 - $8,000',
    dealFrequency: '2-4 deals/week',
  },
  'seiko': {
    name: 'Seiko',
    category: 'watches',
    description: 'Seiko watch deals. Find Prospex, Presage, and limited editions below retail.',
    longDescription: 'Seiko offers incredible value at every price point. We find deals on Prospex divers, Presage dress watches, and limited editions.',
    keywords: ['seiko deals', 'seiko prospex deals', 'seiko presage deals', 'cheap seiko'],
    relatedBrands: ['orient', 'citizen', 'tissot', 'hamilton'],
    avgSavings: '$50 - $500',
    dealFrequency: '15-25 deals/week',
  },

  // MORE SNEAKERS
  'adidas': {
    name: 'Adidas',
    category: 'sneakers',
    description: 'Adidas sneaker deals. Find Ultraboost, Forum, Samba, and collabs below retail.',
    longDescription: 'From Sambas to Ultraboosts, we track Adidas deals across all platforms. Get alerts when prices drop below retail or resale.',
    keywords: ['adidas deals', 'adidas samba deals', 'adidas ultraboost deals', 'cheap adidas'],
    relatedBrands: ['nike', 'new-balance', 'puma', 'reebok'],
    avgSavings: '$20 - $100',
    dealFrequency: '15-20 deals/week',
  },
  'asics': {
    name: 'ASICS',
    category: 'sneakers',
    description: 'ASICS deals. Find Gel-Lyte, Gel-Kayano, and collaborations below market.',
    longDescription: 'ASICS collabs have exploded in popularity. We track Gel-Lyte IIIs, Kayanos, and limited editions.',
    keywords: ['asics deals', 'asics gel lyte deals', 'asics collab deals', 'cheap asics'],
    relatedBrands: ['new-balance', 'nike', 'saucony', 'adidas'],
    avgSavings: '$30 - $150',
    dealFrequency: '8-12 deals/week',
  },
  'travis-scott': {
    name: 'Travis Scott',
    category: 'sneakers',
    description: 'Travis Scott sneaker deals. Find Cactus Jack Jordans and Nike collabs below market.',
    longDescription: 'Travis Scott collabs are some of the most hyped releases. We track every listing to find when prices dip.',
    keywords: ['travis scott deals', 'cactus jack deals', 'travis scott jordan deals', 'travis scott nike deals'],
    relatedBrands: ['jordan', 'nike', 'yeezy', 'off-white'],
    avgSavings: '$100 - $500',
    dealFrequency: '5-10 deals/week',
  },
  'off-white': {
    name: 'Off-White',
    category: 'sneakers',
    description: 'Off-White sneaker deals. Find Virgil Abloh Nike collabs below market.',
    longDescription: 'Off-White x Nike collabs are grails. We monitor the market for The Ten, later releases, and all Virgil designs.',
    keywords: ['off white deals', 'off white nike deals', 'virgil abloh deals', 'off white jordan deals'],
    relatedBrands: ['travis-scott', 'jordan', 'nike', 'yeezy'],
    avgSavings: '$100 - $800',
    dealFrequency: '3-6 deals/week',
  },
  'dunk': {
    name: 'Nike Dunk',
    category: 'sneakers',
    description: 'Nike Dunk deals. Find Dunk Low, Dunk High, and SBs below resale.',
    longDescription: 'Dunks are everywhere but deals are rare. We track every listing to find Dunk Lows and Highs below market.',
    keywords: ['nike dunk deals', 'dunk low deals', 'dunk high deals', 'sb dunk deals'],
    relatedBrands: ['jordan', 'nike', 'new-balance', 'adidas'],
    avgSavings: '$30 - $200',
    dealFrequency: '20-30 deals/week',
  },
  'air-force-1': {
    name: 'Air Force 1',
    category: 'sneakers',
    description: 'Air Force 1 deals. Find AF1 collabs and limited editions below retail.',
    longDescription: 'Air Force 1s are icons. We track limited editions, collabs, and special releases at below-market prices.',
    keywords: ['air force 1 deals', 'af1 deals', 'air force 1 collab deals', 'cheap air force 1'],
    relatedBrands: ['dunk', 'jordan', 'nike', 'adidas'],
    avgSavings: '$20 - $150',
    dealFrequency: '10-15 deals/week',
  },

  // MORE CARS
  'lamborghini': {
    name: 'Lamborghini',
    category: 'cars',
    description: 'Lamborghini deals. Find Huracán, Urus, and Aventador below market.',
    longDescription: 'Lamborghinis are statement cars. We track listings to find when depreciation creates buying opportunities.',
    keywords: ['lamborghini deals', 'lamborghini huracan deals', 'lamborghini urus deals', 'cheap lamborghini'],
    relatedBrands: ['ferrari', 'mclaren', 'porsche', 'aston-martin'],
    avgSavings: '$30,000 - $100,000',
    dealFrequency: '1-2 deals/week',
  },
  'mclaren': {
    name: 'McLaren',
    category: 'cars',
    description: 'McLaren deals. Find 720S, Artura, and GT below market value.',
    longDescription: 'McLaren offers supercar performance at (relative) value. We find deals when sellers need to move quickly.',
    keywords: ['mclaren deals', 'mclaren 720s deals', 'mclaren gt deals', 'cheap mclaren'],
    relatedBrands: ['ferrari', 'lamborghini', 'porsche', 'aston-martin'],
    avgSavings: '$20,000 - $80,000',
    dealFrequency: '1-3 deals/week',
  },
  'mercedes-amg': {
    name: 'Mercedes-AMG',
    category: 'cars',
    description: 'Mercedes-AMG deals. Find GT, C63, E63, and G63 below market.',
    longDescription: 'AMG models depreciate faster than you think. We find deals on GT coupes, C63s, and the mighty G-Wagon.',
    keywords: ['mercedes amg deals', 'amg gt deals', 'c63 amg deals', 'g63 amg deals'],
    relatedBrands: ['bmw-m', 'audi-rs', 'porsche', 'alfa-romeo'],
    avgSavings: '$10,000 - $40,000',
    dealFrequency: '5-8 deals/week',
  },
  'audi-rs': {
    name: 'Audi RS',
    category: 'cars',
    description: 'Audi RS deals. Find RS3, RS5, RS6, RS7 below market value.',
    longDescription: 'Audi RS models offer sleeper performance. We track RS3s, RS6 Avants, and R8s for below-market deals.',
    keywords: ['audi rs deals', 'audi rs6 deals', 'audi rs3 deals', 'audi r8 deals'],
    relatedBrands: ['bmw-m', 'mercedes-amg', 'porsche', 'volkswagen-r'],
    avgSavings: '$8,000 - $30,000',
    dealFrequency: '4-7 deals/week',
  },
  'corvette': {
    name: 'Corvette',
    category: 'cars',
    description: 'Corvette deals. Find C8, Z06, and Stingray below market value.',
    longDescription: 'The C8 Corvette changed everything. We track listings to find when the hype settles and deals appear.',
    keywords: ['corvette deals', 'c8 corvette deals', 'corvette z06 deals', 'cheap corvette'],
    relatedBrands: ['porsche', 'bmw-m', 'mustang', 'camaro'],
    avgSavings: '$5,000 - $25,000',
    dealFrequency: '5-10 deals/week',
  },
  'mustang': {
    name: 'Ford Mustang',
    category: 'cars',
    description: 'Mustang deals. Find GT, Shelby GT350, GT500 below market.',
    longDescription: 'Mustangs offer muscle car thrills at attainable prices. We find deals on GTs, Shelbys, and special editions.',
    keywords: ['mustang deals', 'shelby gt500 deals', 'mustang gt deals', 'cheap mustang'],
    relatedBrands: ['corvette', 'camaro', 'challenger', 'bmw-m'],
    avgSavings: '$3,000 - $20,000',
    dealFrequency: '8-12 deals/week',
  },
};

// Category pages
const categoryData: Record<string, {
  name: string;
  description: string;
  brands: string[];
}> = {
  'watches': {
    name: 'Watch Deals',
    description: 'Find luxury watches below market value. Rolex, Omega, Patek Philippe, AP and more.',
    brands: ['rolex', 'omega', 'tudor', 'patek-philippe', 'audemars-piguet', 'breitling', 'tag-heuer', 'iwc', 'panerai', 'grand-seiko', 'cartier', 'jaeger-lecoultre', 'seiko'],
  },
  'sneakers': {
    name: 'Sneaker Deals',
    description: 'Nike, Jordan, Yeezy, New Balance — find sneakers below retail and resale prices.',
    brands: ['nike', 'jordan', 'yeezy', 'new-balance', 'adidas', 'asics', 'travis-scott', 'off-white', 'dunk', 'air-force-1'],
  },
  'cars': {
    name: 'Car Deals',
    description: 'Porsche, Ferrari, BMW M — find enthusiast cars below market value.',
    brands: ['porsche', 'ferrari', 'bmw-m', 'lamborghini', 'mclaren', 'mercedes-amg', 'audi-rs', 'corvette', 'mustang'],
  },
};

interface Deal {
  id: string;
  title: string;
  price: number;
  marketPrice: number;
  savings: number;
  savingsPercent: number;
  source: string;
  url: string;
  image?: string;
  postedAt: string;
}

export default function Deals() {
  const { brand, category } = useParams<{ brand?: string; category?: string }>();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const brandInfo = brand ? brandData[brand.toLowerCase()] : null;
  const categoryInfo = category ? categoryData[category.toLowerCase()] : null;

  useEffect(() => {
    // Fetch deals from API
    const fetchDeals = async () => {
      setLoading(true);
      try {
        const endpoint = brand 
          ? `/api/deals/brand/${brand}`
          : category 
            ? `/api/deals/category/${category}`
            : '/api/deals/hot';
        
        const res = await fetch(endpoint);
        const data = await res.json();
        setDeals(data.deals || []);
      } catch (error) {
        console.error('Failed to fetch deals:', error);
        // Use placeholder data for now
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, [brand, category]);

  // Index page - show all categories
  if (!brand && !category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Helmet>
          <title>Deals | The Hub - Watch, Sneaker & Car Deals Below Market</title>
          <meta name="description" content="Find watches, sneakers, and cars below market value. Real-time alerts for Rolex, Nike, Jordan, Porsche and more." />
        </Helmet>

        <div className="max-w-6xl mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center mb-4">Find Deals Below Market</h1>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            We monitor 50+ sources 24/7 to find underpriced watches, sneakers, and cars.
          </p>

          {/* Categories */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {Object.entries(categoryData).map(([slug, cat]) => (
              <Link 
                key={slug}
                to={`/deals/category/${slug}`}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-gray-200 group"
              >
                <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </h2>
                <p className="text-gray-600 mb-4">{cat.description}</p>
                <div className="flex flex-wrap gap-2">
                  {cat.brands.slice(0, 4).map(b => (
                    <span key={b} className="text-sm bg-gray-100 px-3 py-1 rounded-full capitalize">
                      {brandData[b]?.name || b}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>

          {/* Popular Brands */}
          <h2 className="text-2xl font-bold mb-6">Popular Brands</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(brandData).slice(0, 12).map(([slug, b]) => (
              <Link
                key={slug}
                to={`/deals/${slug}`}
                className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-center"
              >
                <span className="font-medium">{b.name}</span>
                <span className="block text-xs text-gray-500 capitalize mt-1">{b.category}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Category page
  if (categoryInfo && !brand) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Helmet>
          <title>{categoryInfo.name} | The Hub - Find {categoryInfo.name} Below Market</title>
          <meta name="description" content={categoryInfo.description} />
        </Helmet>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{categoryInfo.name}</h1>
            <p className="text-xl text-gray-300">{categoryInfo.description}</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">Browse by Brand</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryInfo.brands.map(b => {
              const info = brandData[b];
              if (!info) return null;
              return (
                <Link
                  key={b}
                  to={`/deals/${b}`}
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                >
                  <h3 className="text-xl font-bold mb-2">{info.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{info.description}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">Avg savings: {info.avgSavings}</span>
                    <span className="text-gray-500">{info.dealFrequency}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="py-16 bg-gradient-to-br from-blue-600 to-purple-700">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Get {categoryInfo.name} Alerts
            </h2>
            <p className="text-blue-100 mb-8">
              Be the first to know when deals drop. Join 10,000+ collectors and resellers.
            </p>
            <EmailCaptureHero 
              source={`deals-${category}`}
              buttonText="Get Free Alerts"
              placeholder="Enter your email"
              className="max-w-md mx-auto"
            />
          </div>
        </div>
      </div>
    );
  }

  // Brand page
  if (!brandInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Brand not found</h1>
          <Link to="/deals" className="text-blue-600 hover:underline">
            Browse all deals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{brandInfo.name} Deals | Find {brandInfo.name} Below Market | The Hub</title>
        <meta name="description" content={brandInfo.description} />
        <meta name="keywords" content={brandInfo.keywords.join(', ')} />
        <meta property="og:title" content={`${brandInfo.name} Deals - Below Market Prices`} />
        <meta property="og:description" content={brandInfo.description} />
      </Helmet>

      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 text-gray-400 mb-4">
            <Link to="/deals" className="hover:text-white">Deals</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/deals/category/${brandInfo.category}`} className="hover:text-white capitalize">
              {brandInfo.category}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{brandInfo.name}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {brandInfo.name} Deals
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl">
            {brandInfo.longDescription}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg">
            <div>
              <div className="text-2xl font-bold text-green-400">{brandInfo.avgSavings}</div>
              <div className="text-sm text-gray-400">Avg. Savings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{brandInfo.dealFrequency}</div>
              <div className="text-sm text-gray-400">Deal Frequency</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">50+</div>
              <div className="text-sm text-gray-400">Sources Tracked</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert CTA */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold">Get {brandInfo.name} Deal Alerts</h2>
                <p className="text-sm text-gray-600">Be first to know when prices drop below market</p>
              </div>
            </div>
            <EmailCaptureHero 
              source={`deals-${brand}`}
              buttonText="Get Alerts"
              placeholder="Enter email"
              inline
            />
          </div>
        </div>
      </div>

      {/* Deals */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recent {brandInfo.name} Deals</h2>
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse">
                <div className="h-40 bg-gray-200 rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : deals.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map(deal => (
              <a 
                key={deal.id}
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow group"
              >
                {deal.image && (
                  <img src={deal.image} alt={deal.title} className="w-full h-40 object-cover rounded-lg mb-4" />
                )}
                <h3 className="font-semibold mb-2 group-hover:text-blue-600 line-clamp-2">
                  {deal.title}
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">${deal.price.toLocaleString()}</span>
                  <span className="text-sm text-gray-500 line-through">${deal.marketPrice.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-600 font-medium">
                    Save ${deal.savings.toLocaleString()} ({deal.savingsPercent}%)
                  </span>
                  <span className="text-xs text-gray-400">{deal.source}</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No active deals right now</h3>
            <p className="text-gray-600 mb-6">
              {brandInfo.name} deals go fast. Sign up for alerts to catch the next one.
            </p>
            <EmailCaptureHero 
              source={`deals-${brand}-empty`}
              buttonText="Alert Me"
              placeholder="Enter your email"
              className="max-w-sm mx-auto"
            />
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">How We Find {brandInfo.name} Deals</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Monitor 50+ Sources</h3>
              <p className="text-gray-600 text-sm">
                We track eBay, Chrono24, Reddit, Facebook groups, dealers, and more — 24/7.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">AI Scores Every Listing</h3>
              <p className="text-gray-600 text-sm">
                Our AI compares to market prices and identifies underpriced listings instantly.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Alert You First</h3>
              <p className="text-gray-600 text-sm">
                When we find a deal, you get an alert via Telegram, email, or SMS — in seconds.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related brands */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold mb-6">Related Brands</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {brandInfo.relatedBrands.map(b => {
            const info = brandData[b];
            if (!info) return null;
            return (
              <Link
                key={b}
                to={`/deals/${b}`}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-center"
              >
                <span className="font-medium">{info.name}</span>
                <span className="block text-xs text-gray-500 capitalize mt-1">{info.category}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-16 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Never Miss a {brandInfo.name} Deal Again
          </h2>
          <p className="text-blue-100 mb-8">
            Join thousands who use The Hub to find {brandInfo.name.toLowerCase()} below market value.
          </p>
          <EmailCaptureHero 
            source={`deals-${brand}-footer`}
            buttonText="Get Free Alerts"
            placeholder="Enter your email"
            className="max-w-md mx-auto"
          />
        </div>
      </div>
    </div>
  );
}
