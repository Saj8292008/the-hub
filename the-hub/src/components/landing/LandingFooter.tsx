import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Twitter, Github, MessageCircle } from 'lucide-react';

const LandingFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '#features' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'How It Works', href: '#how-it-works' },
        { name: 'FAQ', href: '#faq' }
      ]
    },
    {
      title: 'Categories',
      links: [
        { name: 'Watches', href: '/watches' },
        { name: 'Sneakers', href: '/sneakers' },
        { name: 'Cars', href: '/cars' },
        { name: 'Sports', href: '/sports' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Blog', href: '/blog' },
        { name: 'About', href: '/about' },
        { name: 'Compare', href: '/compare' },
        { name: 'Deals', href: '/deals' }
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'Login', href: '/login' },
        { name: 'Sign Up', href: '/signup' },
        { name: 'Premium', href: '/premium' },
        { name: 'Mission Control', href: '/mission-control' }
      ]
    }
  ];

  return (
    <footer className="bg-gray-950 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 group mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">The Hub</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Never miss a deal on watches, sneakers, cars & collectibles. 24/7 monitoring across 20+ marketplaces.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://t.me/hubtest123"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
              </a>
              <a
                href="https://twitter.com/thehub"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Twitter className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
              </a>
              <a
                href="https://github.com/thehub"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Github className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    {link.href.startsWith('#') ? (
                      <a
                        href={link.href}
                        className="text-gray-400 hover:text-white transition-colors text-sm"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-gray-400 hover:text-white transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              © {currentYear} The Hub. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link to="/privacy" className="hover:text-gray-300 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-gray-300 transition-colors">
                Terms of Service
              </Link>
              <Link to="/contact" className="hover:text-gray-300 transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-wrap justify-center items-center gap-8 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>99.9% Uptime</span>
            </div>
            <div>•</div>
            <div>Secure SSL Encryption</div>
            <div>•</div>
            <div>GDPR Compliant</div>
            <div>•</div>
            <div>No Data Selling</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
