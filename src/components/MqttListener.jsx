import React, { useEffect, useState, useRef } from 'react';
import mqtt from 'mqtt';
import { motion, useSpring, useTransform } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import Card from './Card'; // Asegúrate de importar tu componente Card

function AnimatedCounter({ value, className = "" }) {
    const numericValue = Number(value) || 0;
    
    const spring = useSpring(numericValue, { 
        mass: 0.5, 
        stiffness: 80, 
        damping: 15 
    });
    
    const display = useTransform(spring, (current) => current.toFixed(1));

    useEffect(() => {
        spring.set(numericValue);
    }, [spring, numericValue]);

    return <motion.span className={className}>{display}</motion.span>;
}

const nombresEtapas = [
    "Carga de alcohol",
    "Carga de colorante y encendido del mezclador",
    "Carga de glicerina",
    "Cargado de agua",
    "Cargado de perfume",
    "Impresión de etiqueta",
    "Reseteo de ciclo"
];

const leyendasEtapas = {
    0: "ALCOHOL",
    2: "GLICERINA",
    3: "AGUA"
};

export default function MqttListener() {
    // Inicializamos el estado intentando leer lo último guardado en el navegador (F5 friendly)
    const [datosPlc, setDatosPlc] = useState(() => {
        try {
            const savedData = localStorage.getItem('ultimo_plc_data');
            if (savedData) {
                return JSON.parse(savedData);
            }
        } catch (e) {
            console.error("Error al leer localStorage:", e);
        }
        return {
            etapa: 0,
            estadoValvula: 0,
            peso: 0,
            caudal: 0,
            liquidos: {
                agua: { real: 0, setpoint: 50 },
                alcohol: { real: 0, setpoint: 30 },
                glicerina: { real: 0, setpoint: 10 },
                colorante: { real: 0, setpoint: 1.5 }
            }
        };
    });

    const [conectadoBroker, setConectadoBroker] = useState(false);
    const [transmitiendo, setTransmitiendo] = useState(false);
    const [primeraCarga, setPrimeraCarga] = useState(false);

    const inactivityTimerRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        const brokerUrl = 'ws://mqtt.marcospoliti.ar:9001';

        const opciones = {
            clientId: 'react_client_' + Math.random().toString(16).substring(2, 10) + Date.now().toString(16),
            username: 'admin',
            password: '12345',
            clean: true,
            keepalive: 30, // Reducido a 30s para detectar cortes más rápido
            reconnectPeriod: 2000,
        };

        const client = mqtt.connect(brokerUrl, opciones);

        client.on('connect', () => {
            if (!isMounted) return;
            console.log("Conectado al broker MQTT");
            setConectadoBroker(true);
            
            client.subscribe('plc/001/#', (err) => {
                if (err) console.error("Error al suscribirse:", err);
            });
        });

        // Forzamos la caída del estado del broker ante cualquier intento de reconexión o cierre
        client.on('reconnect', () => {
            console.warn("Intentando reconectar al broker...");
            if (isMounted) {
                setConectadoBroker(false);
                setTransmitiendo(false);
            }
        });

        client.on('error', (err) => {
            console.error("Error de conexión MQTT:", err);
            if (isMounted) {
                setConectadoBroker(false);
                setTransmitiendo(false);
            }
        });

        client.on('offline', () => {
            console.warn("El cliente MQTT se encuentra offline");
            if (isMounted) {
                setConectadoBroker(false);
                setTransmitiendo(false);
            }
        });

        client.on('close', () => {
            if (isMounted) {
                setConectadoBroker(false);
                setTransmitiendo(false);
            }
        });

        client.on('message', (topic, message) => {
            if (!isMounted) return;
            const msgString = message.toString();

            try {
                const data = JSON.parse(msgString);

                // Si llega mensaje, aseguramos que el broker figura conectado
                setConectadoBroker(true);
                setTransmitiendo(true);
                setPrimeraCarga(false);

                if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
                inactivityTimerRef.current = setTimeout(() => {
                    if (isMounted) {
                        setTransmitiendo(false);
                    }
                }, 8000);

                setDatosPlc(prev => {
                    let updated = prev ? { ...prev } : {
                        etapa: 0,
                        estadoValvula: 0,
                        peso: 0,
                        caudal: 0,
                        liquidos: {}
                    };

                    if (topic.startsWith('plc/001/')) {
                        updated.etapa = data.etapa ?? updated.etapa;
                        updated.estadoValvula = data.estado ?? updated.estadoValvula;
                        updated.peso = data.peso ?? updated.peso;
                        updated.caudal = data.caudal ?? updated.caudal;
                    }

                    if (data.liquidos) {
                        updated.liquidos = data.liquidos;
                    }

                    // Guardamos en el almacenamiento local para que sobreviva al F5
                    try {
                        localStorage.setItem('ultimo_plc_data', JSON.stringify(updated));
                    } catch (e) {
                        console.error("Error al guardar en localStorage:", e);
                    }

                    return updated;
                });

            } catch (e) {
                console.error("Error al parsear el JSON de MQTT:", e);
            }
        });

        return () => {
            isMounted = false;
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            if (client) {
                client.end(true);
            }
        };
    }, []);

    const etapaActual = datosPlc?.etapa ?? -1;

    const textoEtapaActual = etapaActual === -1 
        ? "Esperando inicio de ciclo..." 
        : (nombresEtapas[etapaActual] || `Etapa ${etapaActual}`);

    const leyendaActual = etapaActual >= 0 ? leyendasEtapas[etapaActual] : "";

    return (
        <div className="flex flex-col justify-center items-center px-6 py-8 w-full">
            <div className="w-full max-w-[1600px] mx-auto space-y-6">

                {/* Indicador superior de estado de red / broker / PLC */}
                <div className="flex justify-between items-center px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3 text-sm font-mono">
                        <span className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${conectadoBroker ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></span>
                            <span className={conectadoBroker ? 'text-slate-300' : 'text-red-400 font-bold'}>Servidor: {conectadoBroker ? 'Conectado' : 'Desconectado'}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-mono">
                        <span className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${transmitiendo ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'}`}></span>
                            <span className={transmitiendo ? 'text-slate-300' : 'text-amber-400 font-bold'}>PLC: {transmitiendo ? 'Transmitiendo' : 'Sin transmisiones'}</span>
                        </span>
                    </div>
                </div>

                {/* Fila 1: Etapa Actual y Balanza */}
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
                    <Card title="ETAPA ACTUAL">
                        <div className="overflow-hidden py-1">
                            <motion.span 
                                key={textoEtapaActual}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="text-4xl font-black text-emerald-400 uppercase leading-snug block"
                            >
                                {textoEtapaActual}
                            </motion.span>
                        </div>
                    </Card>

                    <Card title="BALANZA">
                        <div className="flex justify-center items-center mb-2">
                            {leyendaActual && (
                                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xl font-black px-2.5 py-1 rounded-full animate-pulse">
                                    {leyendaActual}
                                </span>
                            )}
                        </div>
                        <div className="text-6xl font-black justify-center dark:text-white flex items-baseline gap-1">
                            <AnimatedCounter value={datosPlc?.peso} />
                            <span className="text-xl dark:text-indigo-400">kg</span>
                        </div>
                    </Card>
                </div>

                {/* Fila 2: Estado Válvula y Caudal Actual */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="ESTADO VÁLVULA">
                        <div className="flex items-center justify-center gap-6 h-full">
                            <div className="flex flex-col justify-center">
                                <div className="text-6xl font-black dark:text-white flex items-baseline gap-1">
                                    <AnimatedCounter value={datosPlc?.estadoValvula} />
                                    <span className="text-5xl dark:text-indigo-400">%</span>
                                </div>
                            </div>

                            <div className="w-10 h-28 dark:bg-slate-950/80 bg-white p-1 border dark:border-slate-800 border-slate-950 relative flex items-end overflow-hidden shadow-inner">
                                <motion.div
                                    className="w-full bg-gradient-to-t from-indigo-600 via-sky-500 to-emerald-400 shadow-lg shadow-indigo-500/30"
                                    initial={{ height: "0%" }}
                                    animate={{ height: `${Math.min(Math.max(Number(datosPlc?.estadoValvula) || 0, 0), 100)}%` }}
                                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                                />
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 px-2 py-1">
                                    <div className="w-full border-b dark:border-white border-slate-950"></div>
                                    <div className="w-full border-b dark:border-white border-slate-950"></div>
                                    <div className="w-full border-b dark:border-white border-slate-950"></div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card title="CAUDAL ACTUAL" className="items-center justify-center">
                        <div className="text-6xl font-black dark:text-white flex items-baseline mt-10 justify-center gap-1">
                            <AnimatedCounter value={datosPlc?.caudal} />
                            <p className="text-lg justify-center text-gray-950 dark:text-indigo-600">litros/h</p>
                        </div>
                    </Card>
                </div>

                {/* Fila 3: Líquidos */}
                <div className="w-full">
                    <Card title="LÍQUIDOS (REAL / SETPOINT)">
                        {datosPlc?.liquidos ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-gray-950/60 border-gray-200 dark:border-gray-800 shadow-sm p-3 flex justify-between items-center border border-slate-800/80">
                                    <span className="dark:text-slate-400">Agua</span>
                                    <span className="dark:text-white text-gray-950 text-xl flex items-center gap-1">
                                        <AnimatedCounter className="text-2xl text-emerald-400 font-black" value={datosPlc.liquidos.agua?.real} /> / {datosPlc.liquidos.agua?.setpoint} kg
                                    </span>
                                </div>
                                <div className="bg-white dark:bg-gray-950/60 border-gray-200 dark:border-gray-800 shadow-sm p-3 flex justify-between items-center border border-slate-800/80">
                                    <span className="dark:text-slate-400">Alcohol</span>
                                    <span className="dark:text-white text-gray-950 text-xl flex items-center gap-1">
                                        <AnimatedCounter className="text-2xl text-emerald-400 font-black" value={datosPlc.liquidos.alcohol?.real} /> / {datosPlc.liquidos.alcohol?.setpoint} kg
                                    </span>
                                </div>
                                <div className="bg-white dark:bg-gray-950/60 border-gray-200 dark:border-gray-800 shadow-sm p-3 flex justify-between items-center border border-slate-800/80">
                                    <span className="dark:text-slate-400">Glicerina</span>
                                    <span className="dark:text-white text-gray-950 text-xl flex items-center gap-1">
                                        <AnimatedCounter className="text-2xl text-emerald-400 font-black" value={datosPlc.liquidos.glicerina?.real} /> / {datosPlc.liquidos.glicerina?.setpoint} kg
                                    </span>
                                </div>
                                <div className="bg-white dark:bg-gray-950/60 border-gray-200 dark:border-gray-800 shadow-sm p-3 flex justify-between items-center border border-slate-800/80">
                                    <span className="dark:text-slate-400">Colorante</span>
                                    <span className="dark:text-white text-gray-950 text-xl flex items-center gap-1">
                                        <AnimatedCounter className="text-2xl text-emerald-400 font-black" value={datosPlc.liquidos.colorante?.real} /> / {datosPlc.liquidos.colorante?.setpoint} kg
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <span className="text-sm text-slate-500 italic">Esperando datos de líquidos...</span>
                        )}
                    </Card>
                </div>

            </div>
        </div>
    );
}