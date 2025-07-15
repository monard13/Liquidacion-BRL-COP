
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fetchBrlCopRate } from './services/exchangeRateService';
import type { LiquidationRecord } from './App';

// --- Helper Functions and Components ---

const formatCurrency = (value: number, currencyCode: 'COP' | 'BRL') => {
    const locale = currencyCode === 'COP' ? 'es-CO' : 'pt-BR';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

const Spinner: React.FC = () => (
    <div role="status" className="flex justify-center items-center space-x-2">
        <div className="w-3 h-3 rounded-full animate-pulse bg-blue-800 dark:bg-blue-200"></div>
        <div className="w-3 h-3 rounded-full animate-pulse bg-blue-800 dark:bg-blue-200" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-3 h-3 rounded-full animate-pulse bg-blue-800 dark:bg-blue-200" style={{ animationDelay: '0.2s' }}></div>
        <span className="sr-only">Loading...</span>
    </div>
);

interface CurrencyInputRowProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    currencySymbol: string;
}

const CurrencyInputRow: React.FC<CurrencyInputRowProps> = ({ label, value, onChange, currencySymbol }) => (
    <div className="flex justify-between items-center py-3">
        <span className="text-gray-600 dark:text-gray-300 text-lg">{label}</span>
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{currencySymbol}</span>
            <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={onChange}
                placeholder="0.00"
                className="w-44 text-right bg-gray-100 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 rounded-md py-2 pl-8 pr-3 text-lg text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                aria-label={`${label} input`}
            />
        </div>
    </div>
);

interface ResultRowProps {
    label: string;
    value: string;
    formula?: string;
    boldLabel?: boolean;
    containerClassName?: string;
    valueClassName?: string;
    labelClassName?: string;
}

const ResultRow: React.FC<ResultRowProps> = ({ label, value, formula, boldLabel = false, containerClassName = '', valueClassName = '', labelClassName = '' }) => (
    <div className={`flex justify-between items-center py-4 px-6 ${containerClassName}`}>
        <div className="flex flex-col">
            <span className={`text-lg ${boldLabel ? 'font-bold' : ''} ${labelClassName}`}>
                {label}
            </span>
            {formula && <span className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">{formula}</span>}
        </div>
        <span className={`text-xl font-semibold font-mono ${valueClassName}`}>
            {value}
        </span>
    </div>
);

// --- Calculator Component ---

interface CalculatorProps {
    onAddToHistory: (recordData: Omit<LiquidationRecord, 'id' | 'comprobanteUrl'> & { file: File }) => void;
    onNavigateToHistory: () => void;
}

const Calculator: React.FC<CalculatorProps> = ({ onAddToHistory, onNavigateToHistory }) => {
    const [nequi, setNequi] = useState('');
    const [bancolombia, setBancolombia] = useState('');
    const [daviplata, setDaviplata] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);

    const [brlCopRate, setBrlCopRate] = useState<number | null>(null);
    const [isLoadingRate, setIsLoadingRate] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const getRate = async () => {
            try {
                setError(null);
                setIsLoadingRate(true);
                const rate = await fetchBrlCopRate();
                setBrlCopRate(rate);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(errorMessage);
                setBrlCopRate(0);
            } finally {
                setIsLoadingRate(false);
            }
        };
        getRate();
    }, []);

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        if (/^\d*\.?\d*$/.test(value)) {
            setter(value);
        }
    };
    
    const { saldoMovimiento, comision, liquidoCOP, totalBRL } = useMemo(() => {
        const nequiValue = parseFloat(nequi) || 0;
        const bancolombiaValue = parseFloat(bancolombia) || 0;
        const daviplataValue = parseFloat(daviplata) || 0;
        const saldo = nequiValue + bancolombiaValue + daviplataValue;
        const com = saldo * 0.10;
        const liquido = saldo - com;
        const brl = brlCopRate && brlCopRate > 0 ? liquido / brlCopRate : 0;
        return { saldoMovimiento: saldo, comision: com, liquidoCOP: liquido, totalBRL: brl };
    }, [nequi, bancolombia, daviplata, brlCopRate]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setComprobanteFile(e.target.files[0]);
        } else {
            setComprobanteFile(null);
        }
    };

    const handleRegisterClick = () => {
        if (liquidoCOP <= 0 || !brlCopRate || !comprobanteFile) {
            alert("Para registrar, asegúrese de que el 'Líquido COP' sea mayor a cero y que haya adjuntado un comprobante.");
            return;
        }

        onAddToHistory({
            fecha: selectedDate,
            valorCop: saldoMovimiento,
            comisionCop: comision,
            liquidoCop: liquidoCOP,
            tasaBrlCop: brlCopRate,
            totalBrl: totalBRL,
            file: comprobanteFile,
            comprobanteName: comprobanteFile.name
        });

        setNequi('');
        setBancolombia('');
        setDaviplata('');
        setComprobanteFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    return (
        <div className="flex flex-col items-center justify-start p-4 pt-8 pb-12">
            <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                <header className="bg-slate-200 dark:bg-slate-700 p-5 flex flex-wrap justify-center sm:justify-between items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-wider">
                        LIQUIDACION
                    </h1>
                    <input
                        type="date"
                        aria-label="Fecha de liquidación"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-gray-100 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 rounded-md p-2 text-lg text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </header>

                <main className="p-6 space-y-2">
                    <CurrencyInputRow label="Nequi" value={nequi} onChange={handleInputChange(setNequi)} currencySymbol="$" />
                    <CurrencyInputRow label="Bancolombia" value={bancolombia} onChange={handleInputChange(setBancolombia)} currencySymbol="$" />
                    <CurrencyInputRow label="Daviplata" value={daviplata} onChange={handleInputChange(setDaviplata)} currencySymbol="$" />
                </main>

                <hr className="border-gray-200 dark:border-gray-700" />
                
                <section className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                     <ResultRow
                        label="Saldo Movimiento"
                        value={formatCurrency(saldoMovimiento, 'COP')}
                        formula="=Nequi+Bancolombia+Daviplata"
                        boldLabel
                        labelClassName="text-gray-800 dark:text-gray-100"
                        valueClassName="text-blue-600 dark:text-blue-400"
                    />
                     <ResultRow
                        label="Comision 10%"
                        value={formatCurrency(comision, 'COP')}
                        formula="=Saldo Movimiento * 10%"
                        labelClassName="text-gray-600 dark:text-gray-300"
                        valueClassName="text-red-600 dark:text-red-400"
                    />
                </section>

                <section className="bg-amber-300 dark:bg-amber-500">
                     <ResultRow
                        label="Liquido"
                        value={formatCurrency(liquidoCOP, 'COP')}
                        formula="=Saldo Movimiento - Comision"
                        boldLabel
                        containerClassName="text-black"
                    />
                </section>

                <section className="p-6 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="comprobante-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Comprobante <span className="text-red-500 font-bold">*</span>
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    ref={fileInputRef}
                                    id="comprobante-input"
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-100 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-200 dark:hover:file:bg-blue-800 cursor-pointer"
                                />
                                {comprobanteFile && <span className="text-sm text-gray-500 truncate">{comprobanteFile.name}</span>}
                            </div>
                        </div>
                         <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleRegisterClick}
                                disabled={liquidoCOP <= 0 || isLoadingRate || !comprobanteFile}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                            >
                                {isLoadingRate ? 'Cargando Tasa...' : 'Registrar Liquidación'}
                            </button>
                             <button
                                onClick={onNavigateToHistory}
                                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                            >
                                Ver Historial
                            </button>
                        </div>
                    </div>
                </section>
                
                <footer className="bg-blue-200 dark:bg-blue-800">
                    <div className="px-6 py-3 text-center border-b border-blue-300 dark:border-blue-700">
                        {isLoadingRate && (
                            <div className="flex items-center justify-center text-sm font-medium text-blue-800 dark:text-blue-200">
                                <Spinner />
                                <span className="ml-3">Obteniendo tasa de cambio BRL/COP...</span>
                            </div>
                        )}
                        {error && <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>}
                        {brlCopRate && !isLoadingRate && !error &&(
                             <div className="flex items-center justify-center gap-3">
                                <p className="text-sm text-blue-900 dark:text-blue-100">
                                    Tasa de cambio: <strong>1 BRL ≈ {formatCurrency(brlCopRate, 'COP')}</strong>
                                </p>
                                <a
                                    href="https://www.google.com/finance/quote/BRL-COP"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Ver fuente de la tasa de cambio en Google Finance"
                                    className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-200 dark:focus:ring-offset-blue-800 focus:ring-blue-500 transition-colors"
                                >
                                    Fuente
                                </a>
                             </div>
                        )}
                    </div>
                     <ResultRow
                        label="TOTAL BRL"
                        value={formatCurrency(totalBRL, 'BRL')}
                        formula="=Liquido / Tasa BRL-COP"
                        boldLabel
                        containerClassName="text-black"
                    />
                </footer>
            </div>
        </div>
    );
};

export default Calculator;
