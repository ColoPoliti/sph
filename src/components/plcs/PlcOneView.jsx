import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip } from '@fortawesome/free-solid-svg-icons';
import Card from '../Card';
import AnimatedCounter from '../AnimatedCounter';

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

export default function PlcOneView({ data }) {
    const etapaActual = data?.etapa ?? -1;
    const etapasSinLiquidos = [-1, 4, 5, 6];
    const enEspera = etapasSinLiquidos.includes(etapaActual);

    const textoEtapaActual = etapaActual === -1 
        ? "Esperando inicio de ciclo" 
        : (nombresEtapas[etapaActual] || `Etapa ${etapaActual}`);

    const leyendaActual = !enEspera && etapaActual >= 0 ? leyendasEtapas[etapaActual] : "";
    const estadoValvula = enEspera ? 0 : (data?.estadoValvula ?? 0);

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-2 dark:text-indigo-400 text-slate-950 text-xs tracking-wider dark:shadow uppercase border-b border-slate-800 pb-1">
                <FontAwesomeIcon icon={faMicrochip} />
                <span>Canal Activo: plc/001/#</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
                <Card title="ETAPA ACTUAL">
                    <div className="overflow-hidden py-1">
                        <motion.span 
                            key={textoEtapaActual}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="text-4xl font-black text-dark dark:text-emerald-400 uppercase leading-snug block"
                        >
                            {textoEtapaActual}
                        </motion.span>
                    </div>
                </Card>

                <Card title="BALANZA">
                    <div className="flex justify-center items-center mb-2 ">
                        {leyendaActual && (
                            <span className="dark:bg-indigo-500/20 dark:text-indigo-300 bg-indigo-900 text-indigo-300 border border-indigo-500/30 text-xl font-black px-2.5 py-1 rounded-full animate-pulse">
                                {leyendaActual}
                            </span>
                        )}
                    </div>
                    <div className="text-6xl font-black justify-center dark:text-white text-slate-950 flex items-baseline gap-1">
                        <AnimatedCounter value={data?.peso} />
                        <span className="text-xl dark:text-indigo-400 text-slate-950">kg</span>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ESTADO VÁLVULA CON BARRA VERTICAL */}
                <Card title="ESTADO VÁLVULA">
                    <div className="flex items-center justify-center gap-8 h-full py-4">
                        {/* Valor numérico */}
                        <div className="text-6xl font-black dark:text-white text-slate-950 flex items-baseline gap-1">
                            {enEspera ? <span className="dark:text-white text-slate-950">-</span> : <AnimatedCounter value={estadoValvula} />}
                            <span className="text-5xl dark:text-indigo-400 text-slate-950">%</span>
                        </div>

                        {/* Contenedor de la barra vertical con diseño */}
                        <div className="w-10 h-28 dark:bg-slate-950/80 bg-white p-1 border dark:border-slate-800 border-slate-950 relative flex items-end overflow-hidden shadow-inner">
                            <motion.div
                                className="w-full bg-gradient-to-t from-indigo-600 via-sky-500 to-emerald-400 shadow-lg shadow-indigo-500/30"
                                initial={{ height: "0%" }}
                                animate={{ height: enEspera ? "0%" : `${Math.min(Math.max(Number(estadoValvula) || 0, 0), 100)}%` }}
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

                <Card title="CAUDAL ACTUAL">
                    <div className="text-6xl font-black dark:text-white text-slate-950 flex items-baseline mt-10 justify-center gap-1">
                        {enEspera ? <span className="dark:text-white text-slate-950">-</span> : <AnimatedCounter value={data?.caudal} />}
                        <span className="text-lg dark:text-indigo-400 text-slate-950">litros/h</span>
                    </div>
                </Card>
            </div>
        </div>
    );
}