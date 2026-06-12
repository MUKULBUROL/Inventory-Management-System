import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, Package, ShoppingCart, LayoutDashboard, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CommandPalette = ({ isOpen, setIsOpen, navigate }) => {
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setIsOpen, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100"
        >
          <Command className="w-full flex flex-col h-full bg-transparent">
            <div className="flex items-center border-b border-gray-100 px-4">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <Command.Input 
                autoFocus
                placeholder="Type a command or search..." 
                className="flex-1 h-14 bg-transparent outline-none text-gray-900 placeholder:text-gray-400 text-lg"
              />
            </div>
            
            <Command.List className="max-h-[60vh] overflow-y-auto p-2 scroll-smooth">
              <Command.Empty className="py-6 text-center text-gray-500 text-sm">
                No results found.
              </Command.Empty>

              <Command.Group heading="Navigation" className="text-xs font-semibold text-gray-500 uppercase tracking-wider p-2">
                <Command.Item 
                  onSelect={() => { navigate('dashboard'); setIsOpen(false); }}
                  className="flex items-center gap-2 px-3 py-3 text-sm text-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 aria-selected:bg-gray-100"
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Command.Item>
                <Command.Item 
                  onSelect={() => { navigate('products'); setIsOpen(false); }}
                  className="flex items-center gap-2 px-3 py-3 text-sm text-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 aria-selected:bg-gray-100"
                >
                  <Package className="w-4 h-4" /> Products
                </Command.Item>
                <Command.Item 
                  onSelect={() => { navigate('orders'); setIsOpen(false); }}
                  className="flex items-center gap-2 px-3 py-3 text-sm text-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 aria-selected:bg-gray-100"
                >
                  <ShoppingCart className="w-4 h-4" /> Orders
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CommandPalette;
