import { useState, useRef, useEffect } from 'react';
import { userLinks } from '../config/navLinks';
import { useNavigate } from 'react-router-dom';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Cerrar si hace clic afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center gap-4">
              <span className=" font-bold hidden md:block text-white">Admin</span>
              <div className="w-8 h-8 rounded-full bg-secundario flex items-center justify-center text-white font-bold">A</div>
           
      <button onClick={() => setIsOpen(!isOpen)} className="p-2rounded-full transition-all">
        <i className="fa fa-ellipsis-v text-xl" />
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 z-[999] bg-white dark:bg-gray-900 border dark:border-gray-700 shadow-xlnode-v">
          {userLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => { navigate(link.path); setIsOpen(false); }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </div>
     </div>
  );
}