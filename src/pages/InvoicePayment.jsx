import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Save, ArrowLeft, CreditCard, Calendar, DollarSign } from 'lucide-react';

const InvoicePayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Sample invoice data
  const invoice = {
    id: 1,
    invoiceNo: 'INV-2024-001',
    date: '2024-01-15',
    partyName: 'ABC Electronics Ltd',
    totalAmount: 25000,
    paidAmount: 15000,
    dueAmount: 10000,
    status: 'partially_paid'
  };

  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    accountId: '',
    reference: '',
    notes: ''
  });

  // Sample accounts data
  const accounts = [
    { id: 1, name: 'Cash in Hand', type: 'cash' },
    { id: 2, name: 'HDFC Bank - Current', type: 'bank' },
    { id: 3, name: 'SBI Bank - Savings', type: 'bank' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Payment Data:', paymentData);
    navigate('/invoices');
  };

  const handleAmountChange = (value) => {
    const amount = parseFloat(value) || 0;
    if (amount <= invoice.dueAmount) {
      setPaymentData({...paymentData, amount: value});
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Record Payment</h1>
            <p className="text-gray-600 mt-1">Record payment for invoice {invoice.invoiceNo}</p>
          </div>

          {/* Invoice Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Invoice Number</p>
                <p className="text-lg font-bold text-blue-900">{invoice.invoiceNo}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Total Amount</p>
                <p className="text-lg font-bold text-green-900">₹{invoice.totalAmount.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium">Paid Amount</p>
                <p className="text-lg font-bold text-yellow-900">₹{invoice.paidAmount.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Due Amount</p>
                <p className="text-lg font-bold text-red-900">₹{invoice.dueAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Party: <span className="font-medium text-gray-900">{invoice.partyName}</span></p>
              <p className="text-sm text-gray-600 mt-1">Invoice Date: <span className="font-medium text-gray-900">{new Date(invoice.date).toLocaleDateString('en-IN')}</span></p>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <CreditCard size={20} className="text-green-600" />
              Payment Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    max={invoice.dueAmount}
                    step="0.01"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Maximum: ₹{invoice.dueAmount.toLocaleString('en-IN')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData({...paymentData, paymentDate: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account *
                </label>
                <select
                  value={paymentData.accountId}
                  onChange={(e) => setPaymentData({...paymentData, accountId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  required
                >
                  <option value="">Select Account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Transaction ID, Cheque Number, etc."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes about this payment..."
                />
              </div>
            </div>

            {/* Payment Summary */}
            {paymentData.amount && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Payment Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Payment Amount:</span>
                    <span className="font-medium text-blue-900 ml-2">₹{parseFloat(paymentData.amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Remaining Due:</span>
                    <span className="font-medium text-blue-900 ml-2">₹{(invoice.dueAmount - parseFloat(paymentData.amount || 0)).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">New Status:</span>
                    <span className="font-medium text-blue-900 ml-2">
                      {(invoice.dueAmount - parseFloat(paymentData.amount || 0)) === 0 ? 'Paid' : 'Partially Paid'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/invoices')}
                className="w-full sm:w-auto px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 bg-[#000000] text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Record Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoicePayment;