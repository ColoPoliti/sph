import mqtt from 'mqtt';

const client = mqtt.connect('ws://mqtt.marcospoliti.ar:9001', {
  username: 'admin',
  password: '12345'
});

client.on('connect', () => {
  console.log('¡Conectado al broker! Enviando datos en bucle...');
  
  // Envía un paquete cada 2 segundos para que la pantalla nunca se quede en cero
  setInterval(() => {
    const payload = JSON.stringify({
      etapa: 2,          
      estado: 75,        
      peso: 482.3,       
      caudal: 12.4       
    });

    client.publish('plc/001/producto', payload, () => {
      console.log('Paquete enviado al PLC...');
    });
  }, 2000);
});