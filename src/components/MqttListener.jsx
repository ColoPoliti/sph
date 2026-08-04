import React, { useEffect, useState } from 'react';
import mqtt from 'mqtt';
import { motion, useSpring, useTransform } from 'framer-motion';

// Componente para animar los números de forma fluida
// function AnimatedCounter({ value }) {
//     const numericValue = parseFloat(value) || 0;

//     const spring = useSpring(numericValue, { mass: 0.8, stiffness: 75, damping: 15 });
//     const display = useTransform(spring, (current) => current.toFixed(1));

//     useEffect(() => {
//         spring.set(numericValue);
//     }, [numericValue, spring]);

//     return <motion.span>{display}</motion.span>;
// }

function AnimatedCounter({ value }) {
  // Nos aseguramos de que sea un número válido
  const numericValue = Number(value) || 0;
  
  // Inicializamos el resorte
  const spring = useSpring(numericValue, { 
    mass: 0.5, 
    stiffness: 80, 
    damping: 15 
  });
  
  // Transformamos el valor del resorte a un string con 1 decimal
  const display = useTransform(spring, (current) => current.toFixed(1));

  // Cada vez que llegue un número nuevo, forzamos al resorte a animar hacia él
  useEffect(() => {
    spring.set(numericValue);
  }, [spring, numericValue]);

  return <motion.span>{display}</motion.span>;
}
// Mapeo exacto de las etapas según el programa del PLC
const nombresEtapas = [
    "Carga de alcohol",
    "Carga de colorante y encendido del mezclador",
    "Carga de glicerina",
    "Cargado de agua",
    "Cargado de perfume",
    "Impresión de etiqueta",
    "Reseteo de ciclo"
];

export default function MqttListener() {
    const [datosPlc, setDatosPlc] = useState({
        etapa: 2, // Arranca en la etapa 1 por defecto
        estadoValvula: 25,
        peso: 125.4,
        caudal: 15.0,
        liquidos: {
            agua: { real: 25, setpoint: 50 },
            alcohol: { real: 15, setpoint: 30 },
            glicerina: { real: 5, setpoint: 10 },
            colorante: { real: 0.5, setpoint: 1.5 }
        }
    });
    //   const [datosPlc, setDatosPlc] = useState({
    //     etapa: 0,
    //     estadoValvula: 0,
    //     peso: 0.0,
    //     caudal: 0.0,
    //     liquidos: {
    //       agua: { real: 0, setpoint: 50 },
    //       alcohol: { real: 0, setpoint: 30 },
    //       glicerina: { real: 0, setpoint: 10 },
    //       colorante: { real: 0, setpoint: 1.5 }
    //     }
    //   });

    useEffect(() => {
        let isMounted = true;
        const brokerUrl = 'ws://mqtt.marcospoliti.ar:9001';

        const opciones = {
            clientId: 'react_client_' + Math.random().toString(16).substring(2, 10) + Date.now().toString(16),
            username: 'admin',
            password: '12345',
            clean: true,
            keepalive: 60,
            reconnectPeriod: 2000,
        };

        console.log("Iniciando conexión al broker MQTT...");
        const client = mqtt.connect(brokerUrl, opciones);

        client.on('connect', () => {
            if (!isMounted) return;
            console.log('¡Conectado con éxito! Suscribiéndose a los tópicos...');
            client.subscribe('plc/001/producto', (err) => {
                if (err) console.error("Error al suscribirse:", err);
            });
        });

        client.on('error', (err) => {
            if (isMounted) console.error("Error en la conexión MQTT:", err);
        });

        client.on('message', (topic, message) => {
            if (!isMounted) return;
            const msgString = message.toString();

            // 🔍 AQUÍ VEMOS QUÉ LLEGA EXACTAMENTE DE FRANCISCO
            console.log(`[MQTT] Tópico recibido: ${topic} | Mensaje:`, msgString);

            try {
                const data = JSON.parse(msgString);

                setDatosPlc(prev => {
                    let updated = { ...prev };

                    if (topic === 'plc/001/producto') {
                        updated.etapa = data.etapa ?? prev.etapa;
                        updated.estadoValvula = data.estado ?? prev.estadoValvula;
                        updated.peso = data.peso ?? prev.peso;
                        updated.caudal = data.caudal ?? prev.caudal;
                    }

                    if (data.liquidos) {
                        updated.liquidos = data.liquidos;
                    }

                    return updated;
                });

            } catch (e) {
                console.error("Error al parsear el JSON de MQTT:", e);
            }
        });

        return () => {
            isMounted = false;
            if (client) {
                client.end(true);
            }
        };
    }, []);

    const textoEtapaActual = nombresEtapas[datosPlc.etapa] || `Etapa ${datosPlc.etapa}`;

    return (
        <div className="flex flex-col justify-center items-center px-6 py-8  w-full">

            <div className="w-full max-w-[1600px] mx-auto space-y-10">

                <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Columna 1: Etapa Actual y Balanza */}
                    <div className="grid grid-cols-1 gap-6 w-full">

                        <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl flex flex-col justify-between w-full">
                            <span className="text-sm text-indigo-400 font-bold mb-4 tracking-wider">ETAPA ACTUAL</span>
                            <span className="text-xl font-black text-emerald-400 uppercase leading-snug">
                                {textoEtapaActual}
                            </span>
                        </div>

                        <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl flex flex-col justify-between w-full">
                            <span className="text-sm text-indigo-400 font-bold mb-4 tracking-wider">BALANZA</span>
                            <div className="text-3xl font-black text-indigo-300 flex items-baseline gap-1">
                                <AnimatedCounter value={datosPlc.peso} />
                                <span className="text-xl text-indigo-400">kg</span>
                            </div>
                        </div>

                    </div>

                    {/* Columna 2: Estado de Válvulas / Caudal */}
                    <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl flex flex-col justify-between w-full">
                        <span className="text-sm text-indigo-400 font-bold mb-4 tracking-wider">ESTADO Y CAUDAL</span>
                        <div className="space-y-6 text-sm">

                            {/* Válvula con diseño grande */}
                            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                                <span className="text-slate-400 font-semibold mb-1">⚙️ Apertura Válvula</span>
                                <div className="text-3xl font-black text-white flex items-baseline gap-1">
                                    <AnimatedCounter value={datosPlc.estadoValvula} />
                                    <span className="text-lg text-indigo-400">%</span>
                                </div>
                            </div>

                            {/* Caudal con diseño grande */}
                            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                                <span className="text-slate-400 font-semibold mb-1">⚡ Caudal actual</span>
                                <div className="text-3xl font-black text-amber-400 flex items-baseline gap-1">
                                    <AnimatedCounter value={datosPlc.caudal} />
                                    <span className="text-lg text-amber-600">L/h</span>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Columna 3: Líquidos (Real / Setpoint) */}
                    <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl flex flex-col justify-between w-full">
                        <span className="text-sm text-indigo-400 font-bold mb-4 tracking-wider">LÍQUIDOS (REAL / SETPOINT)</span>
                        {datosPlc.liquidos ? (
                            <div className="grid grid-cols-1 gap-3 text-sm">

                                <div className="bg-slate-900/90 p-2.5 rounded-lg flex justify-between items-center border border-slate-800/60">
                                    <span className="text-slate-400 font-medium">Agua:</span>
                                    <span className="text-white font-bold flex items-center gap-1">
                                        <AnimatedCounter value={datosPlc.liquidos.agua?.real} /> / {datosPlc.liquidos.agua?.setpoint} kg
                                    </span>
                                </div>

                                <div className="bg-slate-900/90 p-2.5 rounded-lg flex justify-between items-center border border-slate-800/60">
                                    <span className="text-slate-400 font-medium">Alcohol:</span>
                                    <span className="text-white font-bold flex items-center gap-1">
                                        <AnimatedCounter value={datosPlc.liquidos.alcohol?.real} /> / {datosPlc.liquidos.alcohol?.setpoint} kg
                                    </span>
                                </div>

                                <div className="bg-slate-900/90 p-2.5 rounded-lg flex justify-between items-center border border-slate-800/60">
                                    <span className="text-slate-400 font-medium">Glicerina:</span>
                                    <span className="text-white font-bold flex items-center gap-1">
                                        <AnimatedCounter value={datosPlc.liquidos.glicerina?.real} /> / {datosPlc.liquidos.glicerina?.setpoint} kg
                                    </span>
                                </div>

                                <div className="bg-slate-900/90 p-2.5 rounded-lg flex justify-between items-center border border-slate-800/60">
                                    <span className="text-slate-400 font-medium">Colorante:</span>
                                    <span className="text-white font-bold flex items-center gap-1">
                                        <AnimatedCounter value={datosPlc.liquidos.colorante?.real} /> / {datosPlc.liquidos.colorante?.setpoint} kg
                                    </span>
                                </div>

                            </div>
                        ) : (
                            <span className="text-sm text-slate-500 italic">Esperando datos de líquidos...</span>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}