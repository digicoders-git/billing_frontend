import React from 'react';

const StatsCard = ({ title, amount, icon: Icon, type, onClick }) => {
  const getTheme = () => {
    switch (type) {
      case 'collect':
        return {
          bg: 'bg-green-50',
          text: 'text-green-600',
          amount: 'text-gray-900',
          iconColor: 'text-green-300' 
        };
      case 'pay':
        return {
          bg: 'bg-red-50',
          text: 'text-red-600',
          amount: 'text-gray-900',
          iconColor: 'text-red-300'
        };
      case 'balance':
        return {
          bg: 'bg-blue-50',
          text: 'text-gray-600',
          amount: 'text-gray-900',
          iconColor: 'text-blue-300'
        };
      case 'purple':
        return {
          bg: 'bg-[#F3F0FF]', // Light purple background
          text: 'text-[#6D28D9]', // Purple text
          amount: 'text-gray-900',
          iconColor: 'text-[#C4B5FD]'
        };
      default:
        return {
          bg: 'bg-white',
          text: 'text-gray-600',
          amount: 'text-gray-900',
          iconColor: 'text-gray-300'
        };
    }
  };

  const theme = getTheme();

  return (
    <div 
        onClick={onClick}
        className={`p-6 rounded-xl border border-gray-100 ${theme.bg} relative transition-all hover:shadow-lg ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
            {type === 'collect' && <Icon size={16} className={theme.text} />}
            {type === 'pay' && <Icon size={16} className={theme.text} />}
            {type === 'balance' && <Icon size={16} className="text-gray-500" />}
            {type === 'purple' && <Icon size={16} className={theme.text} />}

            <span className={`text-sm font-medium ${type === 'balance' ? 'text-gray-500' : theme.text}`}>
                {title}
            </span>
        </div>
        <div className={`p-1 rounded-full ${theme.bg}`}>
           {/* Placeholder for top right trend/icon arrow if needed, mostly static in image */}
           <Icon size={20} className="text-gray-300 opacity-50 transform -rotate-45" strokeWidth={1.5} />
        </div>
      </div>
      
      <div className={`text-2xl font-semibold ${theme.amount} mt-2`}>
        {amount}
      </div>
    </div>
  );
};

export default StatsCard;