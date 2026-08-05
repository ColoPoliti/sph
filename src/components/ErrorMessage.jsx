import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

export default function ErrorMessage({ mensaje }) {
    return (
        <div className="w-full bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex items-center gap-4 text-red-400 shadow-lg">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-3xl animate-bounce" />
            <div>
                <h4 className="font-black text-lg uppercase tracking-wider">¡Atención, error de sistema!</h4>
                <p className="text-sm text-red-300/80">{mensaje || "Ocurrió un problema inesperado en la comunicación."}</p>
            </div>
        </div>
    );
}