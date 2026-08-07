import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './context/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button 
      onClick={toggleTheme}
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.1, rotate: 15 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`absolute top-[85px] right-6 md:top-auto md:bottom-10 md:right-10 rounded-full transition-colors duration-300 shadow-lg z-50 flex items-center justify-center border w-14 h-14 ${
          theme === 'light' 
              ? 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200 shadow-amber-500/20' 
              : 'bg-indigo-950 text-indigo-300 border-indigo-800 hover:bg-indigo-900 shadow-indigo-950/50'
      }`}
    >
      <motion.div
          key={theme}
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0, rotate: 180, opacity: 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
      >
          <FontAwesomeIcon icon={theme === 'light' ? faSun : faMoon} className="mt-1 text-xl" />
      </motion.div>
    </motion.button>
  );
}