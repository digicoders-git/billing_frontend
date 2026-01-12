import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Construction } from 'lucide-react';

const SalesPlaceholder = ({ title }) => {
    return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center h-[70vh] text-gray-500">
                <Construction size={48} className="mb-4 text-orange-400" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
                <p>This page is currently under development to match the premium design.</p>
            </div>
        </DashboardLayout>
    );
};

export default SalesPlaceholder;
