import React from 'react';
import { motion } from 'framer-motion';

interface BoxRevealProps {
  color?: string;
  duration?: number;
  className?: string;
  delay?: number;
  children?: React.ReactNode;
}

const BoxReveal: React.FC<BoxRevealProps> = ({
  color = '#5046e6',
  duration = 0.5,
  delay = 0.25,
  className,
  children
}) => {
  // Motion variants
  const initialMainVariants = { opacity: 0, y: 25 };
  const visibleMainVariants = {
    opacity: 1,
    y: 0
  };
  const initialSlideVariants = { left: '0%' };
  const visibleSlideVariants = {
    left: '100%'
  };

  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={initialMainVariants}
        whileInView={visibleMainVariants}
        transition={{
          duration,
          delay: delay * 2
        }}
        viewport={{ once: true }}
      >
        {children}
      </motion.div>
      
      <motion.div
        className="box-background absolute inset-0 z-20"
        initial={initialSlideVariants}
        whileInView={visibleSlideVariants}
        transition={{
          duration,
          ease: 'easeIn',
          delay
        }}
        viewport={{ once: true }}
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

export default BoxReveal;