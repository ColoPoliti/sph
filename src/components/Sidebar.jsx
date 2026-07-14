// src/components/Sidebar.jsx
import SideNav, { NavItem, NavIcon, NavText } from '@trendmicro/react-sidenav';
import '@trendmicro/react-sidenav/dist/react-sidenav.css';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { navLinks } from '../config/navLinks';

export default function Sidebar({ expanded, setExpanded }) {
    const { theme } = useTheme();
    const navigate = useNavigate();

    return (
        <SideNav
            expanded={expanded}
            onToggle={(expanded) => setExpanded(expanded)}
            onSelect={(selected) => {
                // Acá manejás la navegación real
                navigate('/' + selected);
            }}
            style={{
                position: 'fixed',
                top: '64px', // <-- ¡Pásalo por acá!
                height: 'calc(100vh - 64px)',
                background: theme === 'dark' ? '#060a17' : '#ffffff',
                borderRight: theme === 'dark' ? '' : '1px solid #e5e7eb',
                zIndex: 10
            }}
        >
            <SideNav.Toggle />
            <SideNav.Nav className="dark:text-cyan-900 text-amber-600" defaultSelected="dashboard">
                {navLinks.map((link) => (
                    <NavItem className="dark:text-cyan-900 text-amber-600" key={link.id} eventKey={link.id}>
                        <NavIcon >
                            <i className={`fa fa-fw ${link.icon}`} />
                        </NavIcon>
                        <NavText>{link.label}</NavText>
                    </NavItem>
                ))}
            </SideNav.Nav>
        </SideNav>
    );
}