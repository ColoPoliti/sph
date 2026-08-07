import { Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';
import UserMenu from './UserMenu';
import Logo from './Logo';

export default function Navbar() {
  return (
    <header className="h-16 bg-principal flex items-center justify-between px-8 shadow-sm">
      <Logo text="industria 4" />
      
      <UserMenu />
      <ThemeToggle />
    </header>
  );
}