import React from 'react';
import { ChevronDown, MoveUpRight, MoveDownLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

const stockData = [
    { label: 'Total Sales Items', value: '210', change: '+20%', isPositive: true },
    { label: 'Total Sales Return Items', value: '15', change: '-5%', isPositive: false },
    { label: 'Total Purchase Items', value: '180', change: '+12%', isPositive: true },
    { label: 'Total Purchase Return', value: '10', change: '+2%', isPositive: true },
];

const StockHistory = () => {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-card hover:shadow-hover transition-all duration-300 h-full flex flex-col border border-border/50 animate-slide-up" style={{ animationDelay: '0.4s' }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-gray-800">Stock History</h3>
        <button className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            7 Days <ChevronDown size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {stockData.map((item, index) => (
            <div key={index} className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors border border-transparent hover:border-border/50">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500 text-sm">{item.label}</span>
                    <span className={cn(
                        "text-xs font-semibold flex items-center",
                        item.isPositive ? "text-green-500" : "text-red-500"
                    )}>
                        {item.change}
                    </span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                    {item.value}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default StockHistory;
