import React from 'react';
import logoPng from '../assets/logo.png'; 

export default function Logo({ className = "h-12 w-auto", text = "industria 4" }) {
  return (
    <div className="flex items-center gap-3 cursor-pointer">
      {/* Imagen del logo */}
      <img 
        src={logoPng} 
        alt={`Logo ${text}`} 
        className={`${className} object-contain`} 
      />
      
 
      <span className="font-montserrat hidden md:block text-2xl font-bold tracking-wider text-white">
        {text}
      </span>
    </div>
  );
}