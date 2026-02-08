// Animation Configuration for Framer Motion

import { Variants } from 'framer-motion';

// Fade In Animations
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

// Scale Animations
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

export const scaleInSpring: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: 'spring',
      stiffness: 260,
      damping: 20
    }
  }
};

// Stagger Children
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const staggerFastContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

// Hover Animations
export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.2 }
};

export const hoverLift = {
  y: -8,
  transition: { duration: 0.2 }
};

// Floating Animation (for deal cards)
export const floatingAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut'
  }
};

// Slide In Animations
export const slideInFromBottom: Variants = {
  hidden: { opacity: 0, y: 100 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: 'easeOut' }
  }
};

export const slideInFromTop: Variants = {
  hidden: { opacity: 0, y: -100 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: 'easeOut' }
  }
};

// Rotating Animation
export const rotateIn: Variants = {
  hidden: { opacity: 0, rotate: -180 },
  visible: { 
    opacity: 1, 
    rotate: 0,
    transition: { duration: 0.8, ease: 'easeOut' }
  }
};

// Number Counter Animation
export const numberCounterConfig = {
  duration: 2,
  ease: 'easeOut'
};

// Viewport trigger config (when element enters viewport)
export const viewportConfig = {
  once: true,
  amount: 0.3, // Trigger when 30% of element is visible
  margin: '-50px' // Trigger 50px before element enters viewport
};

export const viewportConfigOnce = {
  once: true,
  amount: 0.2
};

// Accordion Animation
export const accordionVariants: Variants = {
  collapsed: { 
    height: 0, 
    opacity: 0,
    transition: { duration: 0.3 }
  },
  expanded: { 
    height: 'auto', 
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

// Deal Card Animations (specific to hero section)
export const dealCardFloat = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      delay,
      duration: 0.6
    }
  },
  hover: {
    scale: 1.05,
    rotate: 2,
    transition: { duration: 0.2 }
  }
});

// Pulse Animation (for CTAs)
export const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut'
  }
};
