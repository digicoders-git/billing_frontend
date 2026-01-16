import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Save, ArrowLeft, CreditCard, Calendar, DollarSign } from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const InvoicePayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [receiptNo, setReceiptNo] = useState('');
  
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    accountId: '',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [invoiceRes, accountsRes, receiptRes] = await Promise.all([
          api.get(`/invoices/${id}`),
          api.get('/accounts'),
          api.get('/payments/next-receipt?type=Payment In')
        ]);

        setInvoice(invoiceRes.data);
        setAccounts(accountsRes.data);
        setReceiptNo(receiptRes.data.nextNo);
        
        // Pre-fill amount with due amount
        const due = (invoiceRes.data.totalAmount || 0) - (invoiceRes.data.amountReceived || 0);
        setPaymentData(prev => ({
          ...prev,
          amount: due > 0 ? due : ''
        }));

      } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire('Error', 'Failed to load data', 'error');
        navigate('/invoices');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!invoice) return;

    const amount = parseFloat(paymentData.amount);
    const currentDue = (invoice.totalAmount || 0) - (invoice.amountReceived || 0);

    if (amount <= 0 || amount > currentDue) {
      Swal.fire('Error', 'Invalid amount. Cannot exceed due amount.', 'error');
      return;
    }

    try {
      // 1. Create Payment Record
      await api.post('/payments', {
        receiptNo: receiptNo,
        date: paymentData.paymentDate,
        type: 'Payment In',
        party: invoice.party._id || invoice.party, // Handle populated or unpopulated
        partyName: invoice.partyName || invoice.party?.name,
        amount: amount,
        paymentMode: paymentData.paymentMethod,
        referenceNo: paymentData.reference,
        linkedInvoices: [{
          invoiceId: invoice._id,
          amountAdjusted: amount
        }],
        notes: paymentData.notes,
        // user field handled by backend middleware usually
      });

      // 2. Update Invoice Balance & Status
      const newAmountReceived = (invoice.amountReceived || 0) + amount;
      const newBalance = (invoice.totalAmount || 0) - newAmountReceived;
      let newStatus = 'Unpaid';
      if (newBalance <= 0) newStatus = 'Paid';
      else if (newAmountReceived > 0) newStatus = 'Partial';

      await api.put(`/invoices/${id}`, {
        amountReceived: newAmountReceived,
        balanceAmount: newBalance,
        status: newStatus,
        paymentMethod: paymentData.paymentMethod
      });

      Swal.fire({
        title: 'Success!',
        text: 'Payment recorded successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      navigate('/invoices');

    } catch (error) {
      console.error('Error recording payment:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to record payment', 'error');
    }
  };

  const handleAmountChange = (value) => {
    // Allow empty string for backspace
    if (value === '') {
        setPaymentData({...paymentData, amount: ''});
        return;
    }
    
    const amount = parseFloat(value);
    const currentDue = invoice ? ((invoice.totalAmount || 0) - (invoice.amountReceived || 0)) : 0;
    
    if (amount >= 0 && amount <= currentDue) {
      setPaymentData({...paymentData, amount: value});
    } else if (amount > currentDue) {
        // Optional: Clamp to max or just don't update
        // setPaymentData({...paymentData, amount: currentDue});
        // Or just let them type but show error on submit. Better UX to clamp or warn.
        // Let's just update and let validation handle or clamp it? user logic had clamping.
        // I will allow typing and validate or clamp. The user code clamped implicitly by not setting state.
        // I'll stick to clamping logic if valid number.
        setPaymentData({...paymentData, amount: currentDue});
    }
  };

  if (loading || !invoice) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const currentDue = (invoice.totalAmount || 0) - (invoice.amountReceived || 0);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-all text-gray-600">
               <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Record Payment</h1>
                <p className="text-gray-600 mt-1">Record payment for invoice {invoice.invoiceNo}</p>
            </div>
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
                <p className="text-lg font-bold text-green-900">₹{(invoice.totalAmount || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium">Paid Amount</p>
                <p className="text-lg font-bold text-yellow-900">₹{(invoice.amountReceived || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Due Amount</p>
                <p className="text-lg font-bold text-red-900">₹{currentDue.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Party: <span className="font-medium text-gray-900">{invoice.partyName || invoice.party?.name || 'N/A'}</span></p>
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
                    max={currentDue}
                    step="0.01"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Maximum: ₹{currentDue.toLocaleString('en-IN')}</p>
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
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account (Optional)
                </label>
                <select
                  value={paymentData.accountId}
                  onChange={(e) => setPaymentData({...paymentData, accountId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Select Account</option>
                  {accounts.map(account => (
                    <option key={account._id} value={account._id}>
                      {account.accountName || account.name} ({account.accountType || account.type || 'General'})
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
                    <span className="font-medium text-blue-900 ml-2">₹{(currentDue - parseFloat(paymentData.amount || 0)).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">New Status:</span>
                    <span className="font-medium text-blue-900 ml-2">
                      {(currentDue - parseFloat(paymentData.amount || 0)) <= 0 ? 'Paid' : 'Partial'}
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