import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import PlcOneView from './components/plcs/PlcOneView';
import PlcTwoView from './components/plcs/PlcTwoView';
import PlcThreeView from './components/plcs/PlcThreeView';
import Graficos from './pages/Graficos';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/" element={<Login />} />

        {/* Rutas privadas (con menú) */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/graficos" element={<Graficos />} />
          <Route path="/plcOneView" element={<PlcOneView />} />
          <Route path="/plcTwoView" element={<PlcTwoView />} />
          <Route path="/plcThreeView" element={<PlcThreeView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;