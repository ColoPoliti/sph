import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export default function AnimatedCounter({ value, className = "" }) {
    const numericValue = Number(value) || 0;
    
    const spring = useSpring(numericValue, { 
        mass: 0.5, 
        stiffness: 80, 
        damping: 15 
    });
    
    const display = useTransform(spring, (current) => current.toFixed(1));

    useEffect(() => {
        spring.set(numericValue);
    }, [spring, numericValue]);

    return <motion.span className={className}>{display}</motion.span>;
}