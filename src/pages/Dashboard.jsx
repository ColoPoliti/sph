import Card from '../components/Card';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  // Simulamos que los datos llegan después de 2 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex mt-7 flex-col items-center justify-center">
     <div className=" p-8 rounded-2xl text-center max-w-md w-full">
        <h1 className="text-4xl font-extrabold mb-4">
          Dashboard
        </h1>
        <p className="text-gray-600 text-lg">
          Bienvenido al panel principal.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl px-4">
        <Card title="Estadísticas de Ventas" loading={loading}>
          <p>Aca datos reales</p>
        </Card>

        <Card title="Estado del Sistema" loading={loading}>
          <p>Mas datos reales</p>
        </Card>
      </div>
    </div>
  );
}