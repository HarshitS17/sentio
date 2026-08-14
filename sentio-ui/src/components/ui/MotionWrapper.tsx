import { motion, MotionProps } from 'framer-motion';

export const MotionWrapper = ({ children, ...props }: MotionProps & { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    {...props}
  >
    {children}
  </motion.div>
);
