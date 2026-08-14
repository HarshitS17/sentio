import { useState, useEffect } from 'react';

type Listener = (isOpen: boolean) => void;
let isOpen = false;
const listeners = new Set<Listener>();

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const setIsOpen = (value: boolean) => {
  isOpen = value;
  listeners.forEach((listener) => listener(isOpen));
};

export function useCommandPalette() {
  const [open, setOpen] = useState(isOpen);

  useEffect(() => {
    const unsubscribe = subscribe(setOpen);
    return () => { unsubscribe(); };
  }, []);

  return {
    isOpen: open,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(!isOpen),
  };
}
