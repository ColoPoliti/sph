import { Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';
import UserMenu from './UserMenu';

export default function Navbar() {
  return (
    <header className="h-16 bg-purple-600  flex items-center justify-between px-8 shadow-sm">
      <h2 className="text-lg font-semibold text-white">Panel de Control SPH</h2>
      
      <UserMenu />
      <ThemeToggle />
    </header>
  );
}