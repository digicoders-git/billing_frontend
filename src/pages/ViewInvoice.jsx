import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ArrowLeft, Edit, FileText, CreditCard, Calendar, User, Building } from 'lucide-react';

const ViewInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Sample invoice data - in real app, fetch by ID
  const invoice = {
    id: 1,
    invoiceNo: 'INV-2024-001',
    date: '2024-01-15',
    dueDate: '2024-02-14',
    partyName: 'ABC Electronics Ltd',
    partyAddress: '123 Business Park, Andheri East\nMumbai - 400069\nMaharashtra, India',
    partyGSTIN: '27AABCU9603R1ZX',
    partyPhone: '+91 9876543210',
    partyEmail: 'contact@abcelectronics.com',
    items: [
      {
        id: 1,
        description: 'Laptop Computer - Dell Inspiron 15',
        hsn: '8471',
        qty: 2,
        unit: 'PCS',
        rate: 45000,
        discount: 5,
        taxRate: 18,
        amount: 95940
      },
      {
        id: 2,
        description: 'Wireless Mouse - Logitech MX Master',
        hsn: '8471',
        qty: 2,
        unit: 'PCS',
        rate: 3500,
        discount: 0,
        taxRate: 18,
        amount: 8260
      }
    ],
    subtotal: 97000,
    totalDiscount: 2250,
    totalTax: 17064,
    totalAmount: 104200,
    paidAmount: 15000,
    dueAmount: 89200,
    status: 'partially_paid',
    notes: 'Thank you for your business!',
    terms: 'Payment due within 30 days. Late payments may incur additional charges.'
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      partially_paid: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Partially Paid' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Invoice Details</h1>
              <p className="text-sm text-gray-600 mt-1 uppercase font-bold tracking-wider">{invoice.invoiceNo}</p>
            </div>
            
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => navigate(`/edit-invoice/${id}`)}
                className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-bold"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={() => navigate(`/invoice-pdf/${id}`)}
                className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-bold"
              >
                <FileText size={16} />
                PDF
              </button>
              <button
                onClick={() => navigate(`/invoice-payment/${id}`)}
                className="flex-1 sm:flex-none bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-sm font-bold"
              >
                <CreditCard size={16} />
                Payment
              </button>
            </div>
          </div>

          {/* Invoice Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Amount</p>
                  <p className="text-xl font-black text-gray-900">₹{invoice.totalAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Paid Amount</p>
                  <p className="text-xl font-black text-green-600">₹{invoice.paidAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Due Amount</p>
                  <p className="text-xl font-black text-red-600">₹{invoice.dueAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl">
                  <Calendar className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(invoice.status)}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <Building className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8">
            {/* Invoice Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                Invoice Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Invoice Number:</span>
                  <span className="font-bold text-gray-900">{invoice.invoiceNo}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Invoice Date:</span>
                  <span className="font-bold text-gray-900">{new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Due Date:</span>
                  <span className="font-bold text-red-600">{new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Status:</span>
                  {getStatusBadge(invoice.status)}
                </div>
              </div>
            </div>

            {/* Party Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} className="text-green-600" />
                Party Information
              </h3>
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase mb-1">Party Name</span>
                  <p className="font-black text-gray-900 uppercase tracking-tight">{invoice.partyName}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase mb-1">Address</span>
                  <p className="text-sm font-medium text-gray-600 whitespace-pre-line leading-relaxed">{invoice.partyAddress}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-50 transition-all">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">GSTIN</span>
                    <p className="text-sm font-bold text-gray-800">{invoice.partyGSTIN}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Mobile</span>
                    <p className="text-sm font-bold text-gray-800">{invoice.partyPhone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="p-4 sm:p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900">Invoice Items</h3>
              <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase">{invoice.items.length} Items</span>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">HSN</th>
                    <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Qty</th>
                    <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Rate</th>
                    <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Disc%</th>
                    <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tax%</th>
                    <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-gray-800 uppercase tracking-tight">{item.description}</td>
                      <td className="px-6 py-4 text-center text-xs text-gray-500 font-medium">{item.hsn}</td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-gray-800">{item.qty}</td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase">{item.unit}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium">₹{item.rate.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-right text-xs text-blue-600 font-bold">{item.discount}%</td>
                      <td className="px-6 py-4 text-right text-xs text-orange-600 font-bold">{item.taxRate}%</td>
                      <td className="px-6 py-4 text-right text-sm font-black text-gray-900">₹{item.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-50">
              {invoice.items.map((item) => (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="text-sm font-black text-gray-900 uppercase tracking-tight leading-tight">{item.description}</div>
                  <div className="grid grid-cols-2 gap-y-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Qty / Unit</span>
                      <span className="text-xs font-bold text-gray-700">{item.qty} {item.unit}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Rate</span>
                      <span className="text-xs font-bold text-gray-700">₹{item.rate.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Tax / Disc</span>
                      <span className="text-[10px] font-bold">
                        <span className="text-blue-600">{item.discount}% Disc</span>
                        <span className="mx-1 text-gray-200">|</span>
                        <span className="text-orange-600">{item.taxRate}% GST</span>
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Amount</span>
                      <span className="text-sm font-black text-gray-900">₹{item.amount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals and Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Totals */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-black text-gray-900 mb-4 uppercase tracking-tight">Amount Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Subtotal:</span>
                  <span className="font-bold text-gray-800">₹{invoice.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Total Discount:</span>
                  <span className="font-bold text-red-600">-₹{invoice.totalDiscount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-sm pb-3">
                  <span className="text-gray-500 font-medium">Total Tax:</span>
                  <span className="font-bold text-orange-600">₹{invoice.totalTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center bg-gray-900 p-4 rounded-xl text-white shadow-lg overflow-hidden relative">
                    <div className="relative z-10 flex-1 min-w-0">
                      <div className="text-[10px] font-black uppercase opacity-60 tracking-[2px]">Grand Total</div>
                      <div className="text-xl sm:text-2xl font-black truncate">₹{invoice.totalAmount.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12 bg-white rounded-full w-24 h-24" />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-black text-gray-900 mb-4 uppercase tracking-tight">Notes & Terms</h3>
              <div className="space-y-6">
                {invoice.notes && (
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Internal Notes</h4>
                    <div className="bg-gray-50/50 p-3 rounded-lg border-l-2 border-blue-400">
                      <p className="text-sm text-gray-600 leading-relaxed italic">"{invoice.notes}"</p>
                    </div>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Terms & Conditions</h4>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed">{invoice.terms}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>

  );
};

export default ViewInvoice;