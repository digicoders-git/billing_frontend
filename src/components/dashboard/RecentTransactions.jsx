import React from 'react';

const RecentTransactions = ({ transactions = [] }) => {
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
              <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-normal">
                  {transaction.date}
                </td>
                <td className="px-4 py-3 text-gray-600 font-normal">
                   {transaction.type}
                </td>
                <td className="px-4 py-3 text-gray-600 font-normal">
                  {transaction.id}
                </td>
                <td className="px-4 py-3 text-gray-900 font-normal uppercase">
                  {transaction.customer}
                </td>
                <td className="px-4 py-3 text-gray-900 font-normal">
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

