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
    <div className="flex flex-col items-center justify-center dark:text-white">
      <MqttListener />
    </div>
  );
}