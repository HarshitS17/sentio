'use client';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  locale?: string;
  maximumFractionDigits?: number;
};

export default function AnimatedNumber({
  value,
  duration = 0.8,
  locale,
  maximumFractionDigits = 0,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(value);
  const isFirstRender = useRef(true);
  const display = useTransform(motionValue, (latest) =>
    Math.round(latest).toLocaleString(locale, { maximumFractionDigits })
  );

  useEffect(() => {
    if (isFirstRender.current) {
      motionValue.set(0);
      isFirstRender.current = false;
    }
    const animation = animate(motionValue, value, { duration, ease: 'easeOut' });
    return animation.stop;
  }, [value, duration, motionValue]);

  return <motion.span>{display}</motion.span>;
}
