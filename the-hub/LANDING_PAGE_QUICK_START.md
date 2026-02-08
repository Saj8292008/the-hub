# Landing Page Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- The Hub repo cloned

### 1. Install Dependencies
```bash
cd /Users/sydneyjackson/the-hub/the-hub
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```
Visit: http://localhost:5173/

### 3. Make Changes
The landing page lives in these locations:
```
src/
├── pages/LandingNew.tsx          ← Main entry point
└── components/landing/
    ├── HeroSection.tsx           ← Section 1: Hero
    ├── ProblemSolutionSection.tsx ← Section 2: Problem/Solution
    ├── FeaturesGrid.tsx          ← Section 3: Features
    ├── HowItWorksSection.tsx     ← Section 4: How It Works
    ├── PricingSection.tsx        ← Section 5: Pricing
    ├── SocialProofSection.tsx    ← Section 6: Testimonials
    ├── FAQSection.tsx            ← Section 7: FAQ
    ├── FinalCTASection.tsx       ← Section 8: Final CTA
    ├── LandingNav.tsx            ← Navigation
    └── LandingFooter.tsx         ← Footer
```

### 4. Common Tasks

#### Change Headline
```tsx
// src/components/landing/HeroSection.tsx, line ~80
<h1 className="...">
  Never miss a{' '}
  <span className="...">deal</span>  ← Change this
  <br />on what you love
</h1>
```

#### Add/Remove Features
```tsx
// src/components/landing/FeaturesGrid.tsx, line ~10
const features = [
  {
    id: 1,
    icon: Bell,              ← Lucide icon
    title: 'Real-Time Alerts', ← Feature name
    description: '...',      ← Description
    color: 'from-blue-500...' ← Gradient colors
  },
  // Add more features here
];
```

#### Update Testimonials
```tsx
// src/components/landing/SocialProofSection.tsx, line ~10
const testimonials = [
  {
    id: 1,
    name: 'Marcus Chen',
    role: 'Watch Collector',
    avatar: '👨‍💼',
    content: 'Found a Speedmaster...',
    rating: 5
  },
  // Add more here
];
```

#### Modify FAQ Questions
```tsx
// src/components/landing/FAQSection.tsx, line ~10
const faqs = [
  {
    id: 1,
    question: 'How does The Hub find deals?',
    answer: 'We use automated scrapers...'
  },
  // Add more FAQ items
];
```

#### Change Colors
```tsx
// Most sections use these gradient patterns:
from-blue-500 to-purple-600      ← Primary CTA
from-green-500 to-emerald-500    ← Success/positive
from-red-500 to-orange-500       ← Problems/warnings
from-purple-500 to-pink-500      ← Secondary CTA

// Backgrounds:
bg-gray-950   ← Main background
bg-gray-900   ← Section backgrounds
bg-gray-800   ← Card backgrounds
```

#### Adjust Animations
```tsx
// All animations defined in: src/utils/animation-config.ts
import { fadeInUp, scaleIn, staggerContainer } from '../../utils/animation-config';

// Use in components:
<motion.div
  variants={fadeInUp}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
>
  Your content
</motion.div>
```

### 5. Build for Production
```bash
npm run build
```
Output goes to `dist/` folder.

---

## 📝 Common Modifications

### Replace Placeholder Images
```tsx
// src/components/landing/HeroSection.tsx, line ~15
const dealCards: DealCard[] = [
  {
    // ...
    image: '/api/placeholder/300/300', ← Replace with real image URL
  }
];
```

### Update Social Proof Numbers
```tsx
// src/components/landing/HeroSection.tsx, line ~103
<div className="flex items-center gap-2">
  <Users className="w-4 h-4 text-blue-400" />
  <span><strong className="text-white">2,500+</strong> active users</span>
                                         ↑ Change this
</div>

// src/components/landing/SocialProofSection.tsx, line ~62
const stats = [
  { id: 1, value: 2500, label: 'Active Users', prefix: '', suffix: '+' },
                  ↑ Update this number
];
```

### Add New Section
1. Create new component: `src/components/landing/NewSection.tsx`
2. Import in `LandingNew.tsx`
3. Add to render order

```tsx
// src/pages/LandingNew.tsx
import NewSection from '../components/landing/NewSection';

// In JSX:
<PricingSection />
<NewSection />        ← Add here
<SocialProofSection />
```

### Change Email Signup API
```tsx
// src/pages/LandingNew.tsx, line ~13
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                                                      ↑ Change this

// Or set in .env:
VITE_API_URL=https://your-backend.com
```

---

## 🎨 Design System

### Typography Sizes
```tsx
text-7xl    ← Main headline
text-5xl    ← Section headers
text-2xl    ← Subsections
text-xl     ← Large body text
text-base   ← Normal body text
text-sm     ← Small text / captions
```

### Spacing
```tsx
py-24       ← Section vertical padding (96px)
p-8         ← Card padding
gap-8       ← Grid gaps
mb-6        ← Bottom margin
```

### Responsive Breakpoints
```tsx
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

---

## 🐛 Troubleshooting

### "Module not found" Error
```bash
npm install
```

### Animations Not Working
Check Framer Motion is installed:
```bash
npm install framer-motion
```

### Build Fails
Clear cache and rebuild:
```bash
rm -rf dist node_modules/.vite
npm run build
```

### Email Signup Not Working
Check API endpoint in browser console. Fallback to localStorage is enabled for development.

### Styles Not Applying
Restart dev server:
```bash
# Ctrl+C to stop
npm run dev
```

---

## 📚 More Resources

- **Full Documentation:** `LANDING_PAGE_IMPLEMENTATION.md`
- **Visual Guide:** `LANDING_PAGE_VISUAL_GUIDE.md`
- **Completion Report:** `LANDING_PAGE_COMPLETION_REPORT.md`
- **Framer Motion Docs:** https://www.framer.com/motion/
- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **Lucide Icons:** https://lucide.dev/

---

## 💡 Pro Tips

1. **Preview on Mobile:** Use browser DevTools (F12) → Device toolbar
2. **Test Animations:** Scroll slowly to see entrance animations
3. **Check Performance:** Run Lighthouse audit in Chrome DevTools
4. **Dark Mode:** Landing page is dark-only (matches dashboard)
5. **Gradients:** Use https://uigradients.com for inspiration

---

## 🎯 Quick Checklist Before Deploy

- [ ] Replace placeholder images
- [ ] Update social proof numbers
- [ ] Test email signup
- [ ] Check all links work
- [ ] Test on mobile
- [ ] Run build successfully
- [ ] Review meta tags (SEO)
- [ ] Test page speed

---

**Need Help?** Check the main documentation files or search for examples in existing components.

**Happy Coding! 🚀**
