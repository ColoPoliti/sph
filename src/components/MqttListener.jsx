import React, { useEffect, useState } from 'react';
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
    const [datosPlc, setDatosPlc] = useState({
        etapa: -1,
        estadoValvula: 0,
        peso: 0,
        caudal: 0,
        liquidos: {
            agua: { real: 0, setpoint: 50 },
            alcohol: { real: 0, setpoint: 30 },
            glicerina: { real: 0, setpoint: 10 },
            colorante: { real: 0, setpoint: 1.5 }
        }
    });

    const [cargando, setCargando] = useState(true);
    const [mensajeError, setMensajeError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const brokerUrl = 'wss://mqtt.marcospoliti.ar:9001';

        const opciones = {
            clientId: 'react_client_' + Math.random().toString(16).substring(2, 10) + Date.now().toString(16),
            username: 'admin',
            password: '12345',
            clean: true,
            keepalive: 60,
            reconnectPeriod: 2000,
        };

        const client = mqtt.connect(brokerUrl, opciones);

        client.on('connect', () => {
            if (!isMounted) return;
            setMensajeError(null); 
            client.subscribe('plc/001/producto', (err) => {
                if (err) console.error("Error al suscribirse:", err);
            });
        });

        client.on('error', (err) => {
            console.error("Error de conexión MQTT:", err);
            if (isMounted) {
                setMensajeError("No se pudo establecer conexión con el servidor MQTT.");
                setCargando(false);
            }
        });

        client.on('offline', () => {
            if (isMounted) {
                setMensajeError("Se perdió la conexión con el PLC (Broker offline).");
            }
        });

        client.on('message', (topic, message) => {
            if (!isMounted) return;
            const msgString = message.toString();

            try {
                const data = JSON.parse(msgString);

                setCargando(false);
                setMensajeError(null);

                setDatosPlc(prev => {
                    let updated = prev ? { ...prev } : {
                        etapa: 0,
                        estadoValvula: 0,
                        peso: 0,
                        caudal: 0,
                        liquidos: {}
                    };

                    if (topic === 'plc/001/producto') {
                        updated.etapa = data.etapa ?? updated.etapa;
                        updated.estadoValvula = data.estado ?? updated.estadoValvula;
                        updated.peso = data.peso ?? updated.peso;
                        updated.caudal = data.caudal ?? updated.caudal;
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

        const safetyTimer = setTimeout(() => {
            if (isMounted && cargando) {
                setMensajeError("Tiempo de espera agotado. El PLC no emite respuesta.");
                setCargando(false);
            }
        }, 3000);

        return () => {
            isMounted = false;
            clearTimeout(safetyTimer);
            if (client) {
                client.end(true);
            }
        };
    }, []);

    const etapaActual = datosPlc?.etapa ?? -1;

    const textoEtapaActual = cargando || etapaActual === -1 
        ? "Esperando inicio de ciclo..." 
        : (nombresEtapas[etapaActual] || `Etapa ${etapaActual}`);

    const leyendaActual = (etapaActual >= 0 && !cargando) ? leyendasEtapas[etapaActual] : "";

    return (
        <div className="flex flex-col justify-center items-center px-6 py-8 w-full">
            <div className="w-full max-w-[1600px] mx-auto relative">

                {/* Overlay de Desconexión (Blur + Ícono Flotante) */}
                {mensajeError && (
                    <div className="absolute inset-0 z-50 backdrop-blur-md bg-slate-950/70 flex flex-col items-center justify-center gap-4 rounded-3xl border border-red-500/30 p-6 shadow-2xl">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="text-6xl text-red-500 animate-bounce" />
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-white uppercase tracking-wider">¡Sin Conexión con el PLC!</h3>
                            <p className="text-sm text-slate-300 mt-1 max-w-md">{mensajeError}</p>
                        </div>
                    </div>
                )}

                {/* Contenido del Panel (Se desenfoca automáticamente si hay error) */}
                <div className={`space-y-6 transition-all duration-300 ${mensajeError ? 'filter blur-sm pointer-events-none opacity-40 select-none' : ''}`}>

                    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
                        {/* Card 1: Etapa Actual */}
                        <Card title="ETAPA ACTUAL" loading={cargando}>
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

                        {/* Card 2: Balanza */}
                        <Card title="BALANZA" loading={cargando}>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Card 3: Estado Válvula */}
                        <Card title="ESTADO VÁLVULA" loading={cargando}>
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

                        {/* Card 4: Caudal Actual */}
                        <Card title="CAUDAL ACTUAL" loading={cargando} className="items-center justify-center">
                            <div className="text-6xl font-black dark:text-white flex items-baseline mt-10 justify-center gap-1">
                                <AnimatedCounter value={datosPlc?.caudal} />
                                <p className="text-lg justify-center text-gray-950 dark:text-indigo-600">litros/h</p>
                            </div>
                        </Card>
                    </div>

                    <div className="w-full">
                        <Card title="LÍQUIDOS (REAL / SETPOINT)" loading={cargando}>
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
        </div>
    );
}