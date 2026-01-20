import React from 'react';
import { useNavigate } from 'react-router-dom';

const RecentTransactions = ({ transactions = [] }) => {
  const navigate = useNavigate();

  const handleRowClick = (transaction) => {
    if (transaction.type === 'Sales Invoices') {
      navigate(`/view-invoice/${transaction._id}`);
    } else if (transaction.type === 'Purchase') {
      navigate(`/purchases/view/${transaction._id}`);
    } else if (transaction.type === 'Payment In') {
      navigate(`/sales/payment-in/view/${transaction._id}`);
    } else if (transaction.type === 'Payment Out') {
      navigate(`/purchases/view-payment-out/${transaction._id}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Latest Transactions</h3>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Txn No</th>
              <th className="px-4 py-3 font-medium">Party Name</th>
              <th className="px-4 py-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((transaction) => (
              <tr 
                key={transaction._id || transaction.id} 
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleRowClick(transaction)}
              >
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-normal">
                  {transaction.date}
                </td>
                <td className="px-4 py-3">
                   <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                     transaction.type === 'Sales Invoices' ? 'bg-blue-50 text-blue-600' : 
                     transaction.type === 'Purchase' ? 'bg-orange-50 text-orange-600' :
                     transaction.type === 'Payment In' ? 'bg-green-50 text-green-600' :
                     'bg-purple-50 text-purple-600'
                   }`}>
                     {transaction.type}
                   </span>
                </td>
                <td className="px-4 py-3 text-gray-600 font-normal">
                  {transaction.id}
                </td>
                <td className="px-4 py-3 text-gray-900 font-normal uppercase">
                  {transaction.customer}
                </td>
                <td className="px-4 py-3 text-gray-900 font-bold">
                  {transaction.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentTransactions;

