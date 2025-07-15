
import React, { useState, useEffect } from 'react';
import Calculator from './Calculator';
import History from './History';

// --- Type Definition ---
export interface LiquidationRecord {
    id: string;
    fecha: string;
    valorCop: number;
    comisionCop: number;
    liquidoCop: number;
    tasaBrlCop: number;
    totalBrl: number;
    comprobanteUrl: string;
    comprobanteName: string;
}

const App: React.FC = () => {
    const [page, setPage] = useState<'calculator' | 'history'>('calculator');
    const [history, setHistory] = useState<LiquidationRecord[]>([]);

    const navigateToHistory = () => setPage('history');
    const navigateToCalculator = () => setPage('calculator');

    const handleAddToHistory = (newRecordData: Omit<LiquidationRecord, 'id' | 'comprobanteUrl'> & { file: File }) => {
        const newRecord: LiquidationRecord = {
            id: `${Date.now()}-${Math.random()}`,
            ...newRecordData,
            comprobanteUrl: URL.createObjectURL(newRecordData.file),
            comprobanteName: newRecordData.file.name,
        };

        setHistory(prevHistory => [newRecord, ...prevHistory]);
        
        alert('Liquidación registrada con éxito.');
    };

    const handleDeleteRecord = (recordId: string) => {
        setHistory(prevHistory => {
            const recordToDelete = prevHistory.find(r => r.id === recordId);
            if (recordToDelete) {
                // Revoke the object URL to prevent memory leaks
                URL.revokeObjectURL(recordToDelete.comprobanteUrl);
            }
            return prevHistory.filter(record => record.id !== recordId);
        });
    };

    const handleUpdateRecord = (updatedRecord: LiquidationRecord) => {
        setHistory(prevHistory => 
            prevHistory.map(record => 
                record.id === updatedRecord.id ? updatedRecord : record
            )
        );
    };

    // Clean up all object URLs when the component unmounts
    useEffect(() => {
        return () => {
            history.forEach(record => URL.revokeObjectURL(record.comprobanteUrl));
        };
    }, [history]);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {page === 'calculator' ? (
                <Calculator 
                    onAddToHistory={handleAddToHistory} 
                    onNavigateToHistory={navigateToHistory} 
                />
            ) : (
                <History 
                    records={history} 
                    onNavigateToCalculator={navigateToCalculator}
                    onDeleteRecord={handleDeleteRecord}
                    onUpdateRecord={handleUpdateRecord}
                />
            )}
        </div>
    );
};

export default App;
