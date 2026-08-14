import React, { useEffect, useState, useRef } from 'react';
import mqtt from 'mqtt';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import colorLogo from '../assets/logo-foot.png'; 
import { faFlask, faIndustry, faSprayCan, faCogs } from '@fortawesome/free-solid-svg-icons';
import { 
    faMicrochip, 
    faServer, 
    faGaugeHigh, 
    faBars, 
    faTimes 
} from '@fortawesome/free-solid-svg-icons';

import PlcOneView from './plcs/PlcOneView';
import PlcTwoView from './plcs/PlcTwoView';
import PlcThreeView from './plcs/PlcThreeView';
import PlcFourView from './plcs/PlcFourView';

const estadosIniciales = {
    'plc/001': {
        etapa: -1,
        estadoValvula: 0,
        peso: 0,
        caudal: 0,
        transmitiendo: false,
        ultimaHora: null
    },
    'plc/002': {
        etapa: -1,
        estadoValvula: 0,
        peso: 0,
        caudal: 0,
        transmitiendo: false,
        ultimaHora: null
    },
    'plc/003': {
        etapa: -1,
        estadoValvula: 0,
        peso: 0,
        caudal: 0,
        transmitiendo: false,
        ultimaHora: null
    },
    'plc/004': {
        etapa: -1,
        estadoValvula: 0,
        peso: 0,
        caudal: 0,
        transmitiendo: false,
        ultimaHora: null
    }
};

const TOPICS_SUSCRIPCION = [
    'plc/001/#',
    'plc/002/#',
    'plc/003/#',
    'plc/004/#'
];

export default function MqttListener({ toggleTheme, theme }) {
    const [activeTab, setActiveTab] = useState('plc1');
    const [isExpanded, setIsExpanded] = useState(true);

    const [dispositivosData, setDispositivosData] = useState(() => {
        try {
            const savedData = localStorage.getItem('ultimo_multitopics_data');
            if (savedData) return JSON.parse(savedData);
        } catch (e) {
            console.error("Error al leer localStorage:", e);
        }
        return estadosIniciales;
    });

    const [conectadoBroker, setConectadoBroker] = useState(false);
    const inactivityTimersRef = useRef({});

    useEffect(() => {
        let isMounted = true;
        const brokerUrl = 'wss://mqtt.marcospoliti.ar:9001/';

        const opciones = {
            clientId: 'react_client_' + Math.random().toString(16).substring(2, 10),
            clean: true,
            connectTimeout: 4000,
            reconnectPeriod: 1000,
        };

        const client = mqtt.connect(brokerUrl, opciones);

        client.on('connect', () => {
            if (!isMounted) return;
            setConectadoBroker(true);
            client.subscribe(TOPICS_SUSCRIPCION, (err) => {
                if (err) console.error("Error al suscribirse:", err);
            });
        });

        client.on('error', () => { if (isMounted) setConectadoBroker(false); });
        client.on('offline', () => { if (isMounted) setConectadoBroker(false); });
        client.on('close', () => { if (isMounted) setConectadoBroker(false); });

        client.on('message', (topic, message) => {
            if (!isMounted) return;
            const msgString = message.toString();

            try {
                const data = JSON.parse(msgString);
                const ahora = new Date();
                const horaFormateada = ahora.toLocaleTimeString();

                setConectadoBroker(true);

                let plcKey = null;
                if (topic.startsWith('plc/001')) plcKey = 'plc/001';
                else if (topic.startsWith('plc/002')) plcKey = 'plc/002';
                else if (topic.startsWith('plc/003')) plcKey = 'plc/003';
                else if (topic.startsWith('plc/004')) plcKey = 'plc/004';

                if (plcKey) {
                    if (inactivityTimersRef.current[plcKey]) {
                        clearTimeout(inactivityTimersRef.current[plcKey]);
                    }

                    inactivityTimersRef.current[plcKey] = setTimeout(() => {
                        if (isMounted) {
                            setDispositivosData(prev => {
                                const currentPlc = prev[plcKey];
                                if (!currentPlc) return prev;
                                const updated = {
                                    ...prev,
                                    [plcKey]: { ...currentPlc, transmitiendo: false }
                                };
                                localStorage.setItem('ultimo_multitopics_data', JSON.stringify(updated));
                                return updated;
                            });
                        }
                    }, 8000);
                }

                setDispositivosData(prev => {
                    let updated = { ...prev };
                    const etapasSinMedicionActiva = [-1, 4, 5, 6];

                    if (topic.startsWith('plc/001')) {
                        const current = updated['plc/001'] || estadosIniciales['plc/001'];
                        const nuevaEtapa = data.etapa ?? current.etapa;
                        let pesoFinal = current.peso;
                        if (!(etapasSinMedicionActiva.includes(nuevaEtapa) && (data.peso === 0 || data.peso === undefined))) {
                            pesoFinal = data.peso ?? current.peso;
                        }

                        updated['plc/001'] = {
                            ...current,
                            etapa: nuevaEtapa,
                            estadoValvula: data.estado ?? current.estadoValvula,
                            peso: pesoFinal,
                            caudal: data.caudal ?? current.caudal,
                            transmitiendo: true,
                            ultimaHora: horaFormateada
                        };
                    } 
                    else if (topic.startsWith('plc/002')) {
                        const current = updated['plc/002'] || estadosIniciales['plc/002'];
                        updated['plc/002'] = {
                            ...current,
                            ...data,
                            transmitiendo: true,
                            ultimaHora: horaFormateada
                        };
                    } 
                    else if (topic.startsWith('plc/003')) {
                        const current = updated['plc/003'] || estadosIniciales['plc/003'];
                        const nuevaEtapa = data.etapa ?? current.etapa;
                        let pesoFinal = current.peso;
                        if (!(etapasSinMedicionActiva.includes(nuevaEtapa) && (data.peso === 0 || data.peso === undefined))) {
                            pesoFinal = data.peso ?? current.peso;
                        }

                        updated['plc/003'] = { 
                            ...current, 
                            ...data,
                            etapa: nuevaEtapa,
                            estadoValvula: data.estado ?? data.estadoValvula ?? current.estadoValvula,
                            peso: pesoFinal,
                            caudal: data.caudal ?? current.caudal,
                            transmitiendo: true,
                            ultimaHora: horaFormateada
                        };
                    }
                    else if (topic.startsWith('plc/004')) {
                        const current = updated['plc/004'] || estadosIniciales['plc/004'];
                        const nuevaEtapa = data.etapa ?? current.etapa;
                        let pesoFinal = current.peso;
                        if (!(etapasSinMedicionActiva.includes(nuevaEtapa) && (data.peso === 0 || data.peso === undefined))) {
                            pesoFinal = data.peso ?? current.peso;
                        }

                        updated['plc/004'] = {
                            ...current,
                            ...data,
                            etapa: nuevaEtapa,
                            estadoValvula: data.estado ?? data.estadoValvula ?? current.estadoValvula,
                            peso: pesoFinal,
                            caudal: data.caudal ?? current.caudal,
                            transmitiendo: true,
                            ultimaHora: horaFormateada
                        };
                    }

                    try {
                        localStorage.setItem('ultimo_multitopics_data', JSON.stringify(updated));
                    } catch (e) {
                        console.error("Error al guardar en localStorage:", e);
                    }

                    return updated;
                });

            } catch (e) {
                console.error("Error al parsear JSON:", e);
            }
        });

        return () => {
            isMounted = false;
            Object.values(inactivityTimersRef.current).forEach(timer => clearTimeout(timer));
            if (client) client.end(true);
        };
    }, []);

    const currentPlcData = dispositivosData[
        activeTab === 'plc1' ? 'plc/001' : 
        activeTab === 'plc2' ? 'plc/002' : 
        activeTab === 'plc3' ? 'plc/003' : 'plc/004'
    ];

    return (
        <div className="flex h-screen w-full dark:bg-gray-950 dark:text-white relative overflow-hidden">
            
            {/* BARRA INFERIOR MÓVIL */}
            <div className="lg:hidden flex items-center justify-around bg-white dark:bg-slate-900 border-t border-slate-800 fixed bottom-0 left-0 right-0 z-50 h-16 shadow-lg px-2">
                <button
                    onClick={() => setActiveTab('plc1')}
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                        activeTab === 'plc1' ? 'text-indigo-500 font-bold' : 'dark:text-slate-400 text-slate-950 hover:text-slate-200'
                    }`}
                >
                    <FontAwesomeIcon icon={faMicrochip} size="lg" />
                    <span className="text-[10px] mt-1">PLC 1</span>
                </button>

                <button
                    onClick={() => setActiveTab('plc2')}
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                        activeTab === 'plc2' ? 'text-sky-500 font-bold' : 'dark:text-slate-400 text-slate-950 hover:text-slate-200'
                    }`}
                >
                    <FontAwesomeIcon icon={faGaugeHigh} size="lg" />
                    <span className="text-[10px] mt-1">PLC 2</span>
                </button>

                <button
                    onClick={() => setActiveTab('plc3')}
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                        activeTab === 'plc3' ? 'text-emerald-500 font-bold' : 'dark:text-slate-400 text-slate-950 hover:text-slate-200'
                    }`}
                >
                    <FontAwesomeIcon icon={faServer} size="lg" />
                    <span className="text-[10px] mt-1">PLC 3</span>
                </button>

                <button
                    onClick={() => setActiveTab('plc4')}
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                        activeTab === 'plc4' ? 'text-teal-500 font-bold' : 'dark:text-slate-400 text-slate-950 hover:text-slate-200'
                    }`}
                >
                    <FontAwesomeIcon icon={faServer} size="lg" />
                    <span className="text-[10px] mt-1">PLC 4</span>
                </button>
            </div>

            {/* SIDEBAR DE ESCRITORIO */}
            <aside className={`
                hidden lg:flex flex-col justify-between
                fixed top-16 left-0 h-[calc(100vh-4rem)]
                bg-slate-900 border-r border-slate-800 
                p-4 lg:p-6 z-40 shadow
                transition-all duration-300 ease-in-out
                ${isExpanded ? 'w-72' : 'w-20'}
            `}>
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${!isExpanded && 'hidden'}`}>
                            <h1 className="font-bold tracking-wider text-sm whitespace-nowrap dark:text-slate-300 text-slate-300">PANEL DE PLC</h1>
                        </div>

                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center justify-center p-2 rounded-lg hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors w-full lg:w-auto"
                        >
                            <FontAwesomeIcon icon={isExpanded ? faTimes : faBars} />
                        </button>
                    </div>

                    <nav className="space-y-2">
    <button
        onClick={() => setActiveTab('plc1')}
        className={`w-full flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center px-0'} py-3 rounded-lg text-sm transition-all group relative ${
            activeTab === 'plc1' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
        }`}
    >
        <span className="text-lg w-6 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faFlask} />
        </span>
        <span className={`whitespace-nowrap transition-all duration-300 ${!isExpanded && 'hidden'}`}>PLC001 Elaboración</span>
    </button>

    <button
        onClick={() => setActiveTab('plc2')}
        className={`w-full flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center px-0'} py-3 rounded-lg text-sm transition-all group relative ${
            activeTab === 'plc2' 
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 font-bold' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
        }`}
    >
        <span className="text-lg w-6 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faFlask} />
        </span>
        <span className={`whitespace-nowrap transition-all duration-300 ${!isExpanded && 'hidden'}`}>PLC002 Elaboración</span>
    </button>

    <button
        onClick={() => setActiveTab('plc3')}
        className={`w-full flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center px-0'} py-3 rounded-lg text-sm transition-all group relative ${
            activeTab === 'plc3' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-bold' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
        }`}
    >
        <span className="text-lg w-6 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faSprayCan} />
        </span>
        <span className={`whitespace-nowrap transition-all duration-300 ${!isExpanded && 'hidden'}`}>PLC003 Aerosoles</span>
    </button>

    <button
        onClick={() => setActiveTab('plc4')}
        className={`w-full flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center px-0'} py-3 rounded-lg text-sm transition-all group relative ${
            activeTab === 'plc4' 
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 font-bold' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
        }`}
    >
        <span className="text-lg w-6 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faSprayCan} />
        </span>
        <span className={`whitespace-nowrap transition-all duration-300 ${!isExpanded && 'hidden'}`}>PLC004 Aerosoles</span>
    </button>
</nav>
                </div>

                <div className="flex items-center gap-2.5 overflow-hidden">
                    <img 
                        src={colorLogo} 
                        alt="Logo Color" 
                        className="h-7 w-7 object-contain flex-shrink-0" 
                    />
                    {isExpanded && (
                        <span 
                            className="font-montserrat text-sm font-bold tracking-tight text-white/90 whitespace-nowrap"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                            industria 4
                        </span>
                    )}
                </div>
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <main className={`flex-1 px-4 lg:px-6 py-4 overflow-y-auto h-full pb-24 lg:pb-6 mt-0 lg:mt-12 transition-all duration-300 ${isExpanded ? 'lg:ml-72' : 'lg:ml-20'}`}>
                <div className="w-full max-w-[1400px] mx-auto space-y-4">
                    <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border border-slate-800 shadow-sm rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${conectadoBroker ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                            <span className="text-slate-300">Servidor MQTT: {conectadoBroker ? 'Online' : 'Offline'}</span>
                        </div>
                        <div className="text-slate-400 text-sm">
                            {currentPlcData?.transmitiendo ? <span className="text-emerald-400 animate-pulse">Recibiendo datos </span> : <span>{`Última señal: ${currentPlcData?.ultimaHora || 'Ninguna'}`}</span>}
                        </div>
                    </div>

                    {activeTab === 'plc1' && <PlcOneView data={dispositivosData['plc/001']} />}
                    {activeTab === 'plc2' && <PlcTwoView data={dispositivosData['plc/002']} />}
                    {activeTab === 'plc3' && <PlcThreeView data={dispositivosData['plc/003']} />}
                    {activeTab === 'plc4' && <PlcFourView data={dispositivosData['plc/004']} />}
                </div>
            </main>
        </div>
    );
}