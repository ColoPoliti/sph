import SideNav, { NavItem, NavIcon, NavText } from '@trendmicro/react-sidenav';
import '@trendmicro/react-sidenav/dist/react-sidenav.css';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { navLinks } from '../config/navLinks';
// Importamos tu imagen del logo en color (asegúrate de tenerla en la ruta correcta)
import colorLogo from '../assets/logo-foot.png'; 
import './App.css';

export default function Sidebar({ expanded, setExpanded }) {
    const { theme } = useTheme();
    const navigate = useNavigate();

    return (
        <SideNav
            className="sidecolor"
            expanded={expanded}
            onToggle={(expanded) => setExpanded(expanded)}
            onSelect={(selected) => {
                const route = selected === 'dashboard' ? '/' : `/${selected}`;
                navigate(route);
            }}
            style={{
                position: 'fixed',
                top: '64px',
                height: 'calc(100vh - 64px)',
                background:'#060a17',
                borderRight: theme === 'dark' ? 'none' : '1px solid #d1d5db',
                zIndex: 40
            }}
        >
            <SideNav.Toggle className="sidecolor" />
            
            <SideNav.Nav defaultSelected="dashboard">
                {navLinks.map((link) => (
                    <NavItem key={link.id} eventKey={link.id}>
                        <NavIcon>
                            <i className={`fa fa-fw ${link.icon}`} style={{ fontSize: '1.5em' }} />
                        </NavIcon>
                        <NavText className="txt-dark">{link.label}</NavText>
                    </NavItem>
                ))}
            </SideNav.Nav>

            {/* Área del Logo en Color abajo de todo (Footer) */}
            <div 
                className={`absolute bottom-5 left-0 w-full flex items-center transition-all duration-200 ease-in-out ${
                    expanded ? 'justify-start px-5' : 'justify-center px-2'
                }`}
            >
                <div className="flex items-center gap-2.5 overflow-hidden">
                    {/* Imagen del logo en color (tamaño fijo pequeño) */}
                    <img 
                        src={colorLogo} 
                        alt="Logo Color" 
                        className="h-7 w-7 object-contain flex-shrink-0" // h-7 / w-7 son tamaños pequeños
                    />
                    
                    {/* Texto del logo (Tipografía más pequeña: text-sm, tracking-tight) */}
                      {expanded && (
                        <span 
                            className="font-montserrat text-sm font-bold tracking-tight text-white/90 whitespace-nowrap"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                            industria 4
                        </span>
                    )}
                </div>
            </div>
            
            <style>{`
                .sidenav-nav {
                    padding-bottom: 80px;
                }
            `}</style>

        </SideNav>
    );
}