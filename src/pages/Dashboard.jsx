import Card from '../components/Card';
import MqttListener from '../components/MqttListener';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  // Simulamos carga inicial breve para las tarjetas
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex mt-7 flex-col items-center justify-center">
      <div className="p-8 rounded-2xl text-center w-full">
        <h1 className="text-4xl font-extrabold mb-4">
          Panel de Visualización
        </h1>
        <p className="text-gray-600 text-lg">
        </p>
      </div>
      <MqttListener />
    </div>
  );
}