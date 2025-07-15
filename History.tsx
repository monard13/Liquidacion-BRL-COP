
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { LiquidationRecord } from './App';

// --- Helper Functions ---
const formatCurrency = (value: number, currencyCode: 'COP' | 'BRL') => {
    const locale = currencyCode === 'COP' ? 'es-CO' : 'pt-BR';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};


// --- Edit Modal Component ---
interface EditModalProps {
    record: LiquidationRecord;
    onSave: (updatedRecord: LiquidationRecord) => void;
    onCancel: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ record, onSave, onCancel }) => {
    const [formData, setFormData] = useState<LiquidationRecord>(record);
    const [newFile, setNewFile] = useState<{ file: File, url: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const valorCop = formData.valorCop || 0;
        const tasaBrlCop = formData.tasaBrlCop || 0;

        const comisionCop = valorCop * 0.10;
        const liquidoCop = valorCop - comisionCop;
        const totalBrl = tasaBrlCop > 0 ? liquidoCop / tasaBrlCop : 0;

        setFormData(d => ({ ...d, comisionCop, liquidoCop, totalBrl }));
    }, [formData.valorCop, formData.tasaBrlCop]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'valorCop' || name === 'tasaBrlCop' ? parseFloat(value) || 0 : value
        }));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const newUrl = URL.createObjectURL(file);
            if (newFile) {
                // Revoke previous new file URL if user changes file multiple times
                URL.revokeObjectURL(newFile.url);
            }
            setNewFile({ file, url: newUrl });
            setFormData(prev => ({ ...prev, comprobanteUrl: newUrl, comprobanteName: file.name }));
        }
    };
    
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // If a new file was chosen, the old URL from the original record needs to be revoked
        if (newFile) {
            URL.revokeObjectURL(record.comprobanteUrl);
        }
        onSave(formData);
    };

    const handleCancel = () => {
        // If a new file was chosen but cancelled, its URL must be revoked
        if (newFile) {
            URL.revokeObjectURL(newFile.url);
        }
        onCancel();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50 transition-opacity" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all" >
                <form onSubmit={handleSave}>
                    <header className="p-5 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Editar Registro</h2>
                    </header>
                    <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
                                <input type="date" id="fecha" name="fecha" value={formData.fecha} onChange={handleChange} className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"/>
                            </div>
                            <div>
                                <label htmlFor="tasaBrlCop" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tasa BRL/COP</label>
                                <input type="number" step="0.01" id="tasaBrlCop" name="tasaBrlCop" value={formData.tasaBrlCop} onChange={handleChange} className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"/>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="valorCop" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor COP (Total)</label>
                            <input type="number" step="0.01" id="valorCop" name="valorCop" value={formData.valorCop} onChange={handleChange} className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <p className="flex justify-between"><span>Comisión (10%):</span> <span className="font-mono">{formatCurrency(formData.comisionCop, 'COP')}</span></p>
                            <p className="flex justify-between font-semibold"><span>Líquido COP:</span> <span className="font-mono">{formatCurrency(formData.liquidoCop, 'COP')}</span></p>
                            <p className="flex justify-between font-bold text-blue-600 dark:text-blue-400"><span>Total BRL:</span> <span className="font-mono">{formatCurrency(formData.totalBrl, 'BRL')}</span></p>
                        </div>
                        <div>
                             <label htmlFor="comprobante" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cambiar Comprobante (Opcional)</label>
                             <input ref={fileInputRef} id="comprobante" type="file" accept="image/*,.pdf" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-blue-100 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-200 dark:hover:file:bg-blue-800 cursor-pointer"/>
                             <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Actual: {formData.comprobanteName}</span>
                        </div>
                    </main>
                    <footer className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                        <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">Guardar Cambios</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

// --- History Page Component ---
interface HistoryProps {
    records: LiquidationRecord[];
    onNavigateToCalculator: () => void;
    onDeleteRecord: (id: string) => void;
    onUpdateRecord: (record: LiquidationRecord) => void;
}

const History: React.FC<HistoryProps> = ({ records, onNavigateToCalculator, onDeleteRecord, onUpdateRecord }) => {

    const [editingRecord, setEditingRecord] = useState<LiquidationRecord | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');


    const handleExportCsv = () => {
        const filteredRecords = records.filter(record => {
            if (!startDate && !endDate) {
                return true; // No date range specified, include all
            }
            const recordIsAfterStartDate = startDate ? record.fecha >= startDate : true;
            const recordIsBeforeEndDate = endDate ? record.fecha <= endDate : true;
            return recordIsAfterStartDate && recordIsBeforeEndDate;
        });

        if (filteredRecords.length === 0) {
            alert("No hay registros para exportar en el rango de fechas seleccionado.");
            return;
        }

        const headers = ['Fecha', 'Valor COP', 'Comision COP', 'Liquido COP', 'TASA BRL/COP', 'TOTAL BRL', 'COMPROBANTE'];
        
        const sanitizeCell = (cellData: any): string => {
            const cellString = String(cellData);
            if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\n')) {
                return `"${cellString.replace(/"/g, '""')}"`;
            }
            return cellString;
        };

        const csvRows = filteredRecords.map(r => 
            [
                r.fecha,
                r.valorCop.toFixed(2),
                r.comisionCop.toFixed(2),
                r.liquidoCop.toFixed(2),
                r.tasaBrlCop.toFixed(2),
                r.totalBrl.toFixed(2),
                sanitizeCell(r.comprobanteName)
            ].join(',')
        );

        const csvString = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `historial_liquidaciones_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDeleteClick = (recordId: string) => {
        if (window.confirm("¿Está seguro de que desea eliminar este registro? Esta acción no se puede deshacer.")) {
            onDeleteRecord(recordId);
        }
    };

    const handleEditClick = (record: LiquidationRecord) => {
        setEditingRecord(record);
    };
    
    const handleSaveEdit = (updatedRecord: LiquidationRecord) => {
        onUpdateRecord(updatedRecord);
        setEditingRecord(null);
    };

    return (
        <>
            {editingRecord && (
                <EditModal 
                    record={editingRecord} 
                    onSave={handleSaveEdit}
                    onCancel={() => setEditingRecord(null)}
                />
            )}
            <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                        Historial de Liquidaciones
                    </h1>
                    <button
                        onClick={onNavigateToCalculator}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    >
                        &larr; Volver a la Calculadora
                    </button>
                </header>

                <section className="mb-8 p-6 bg-white dark:bg-gray-800/50 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Exportar por Rango de Fechas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4">
                        <div className="md:col-span-1">
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Inicio</label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-500"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Fin</label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-500"
                            />
                        </div>
                        <button
                            onClick={handleExportCsv}
                            disabled={records.length === 0}
                            className="md:col-span-1 w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Exportar a CSV
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Deje las fechas en blanco para exportar todos los registros.</p>
                </section>

                <div className="shadow-lg rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    {['Fecha', 'Valor COP', 'Comision COP', 'Liquido COP', 'TASA BRL/COP', 'TOTAL BRL', 'COMPROBANTE', 'Acciones'].map(header => (
                                        <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {records.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                            No hay registros guardados. Vuelva a la calculadora para registrar su primera liquidación.
                                        </td>
                                    </tr>
                                ) : (
                                    records.map(record => (
                                        <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{record.fecha}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-mono">{formatCurrency(record.valorCop, 'COP')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-mono">{formatCurrency(record.comisionCop, 'COP')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-100 font-mono font-semibold">{formatCurrency(record.liquidoCop, 'COP')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-mono">{record.tasaBrlCop.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-100 font-mono font-bold">{formatCurrency(record.totalBrl, 'BRL')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <a 
                                                   href={record.comprobanteUrl} 
                                                   target="_blank" 
                                                   rel="noopener noreferrer" 
                                                   className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                                   title={record.comprobanteName}
                                                >
                                                    <span className="truncate max-w-[150px] inline-block">{record.comprobanteName}</span>
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button onClick={() => handleEditClick(record)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">Editar</button>
                                                <button onClick={() => handleDeleteClick(record.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Eliminar</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default History;
