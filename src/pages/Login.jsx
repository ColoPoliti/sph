import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Acá después validarás usuario y pass, ahora solo simulamos:
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
  <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl w-96">
    <h1 className="text-2xl font-bold text-white mb-6">Acceso SPH</h1>
        <button 
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Entrar al Dashboard
        </button>
      </div>
    </div>
  );
}