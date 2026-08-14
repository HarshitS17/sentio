'use client';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  locale?: string;
  maximumFractionDigits?: number;
};

export default function AnimatedNumber({
  value,
  duration = 1.2,
  locale,
  maximumFractionDigits = 0,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (latest) =>
    Math.round(latest).toLocaleString(locale, { maximumFractionDigits })
  );

  useEffect(() => {
    motionValue.set(0);
    const animation = animate(motionValue, value, { duration, ease: 'easeOut' });
    return animation.stop;
  }, [value, duration, motionValue]);

  return <motion.span>{display}</motion.span>;
}
