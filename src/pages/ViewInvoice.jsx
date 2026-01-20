import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ArrowLeft, Edit, FileText, CreditCard, Calendar, User, Building } from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const ViewInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch invoice data from API
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/invoices/${id}`);
        setInvoice(response.data);
      } catch (error) {
        console.error('Error fetching invoice:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load invoice details',
        });
        navigate('/invoices');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvoice();
    }
  }, [id, navigate]);

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading invoice...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error if no invoice found
  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600 font-medium">Invoice not found</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }


  const getStatusBadge = (status) => {
    const statusConfig = {
      'Draft': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      'Paid': { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
      'Unpaid': { bg: 'bg-red-100', text: 'text-red-800', label: 'Unpaid' },
      'Partial': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Partially Paid' },
      'Overdue': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Overdue' }
    };
    
    const config = statusConfig[status] || statusConfig['Draft'];
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
                  <p className="text-xl font-black text-green-600">₹{(invoice.amountReceived || 0).toLocaleString('en-IN')}</p>
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
                  <p className="text-xl font-black text-red-600">₹{(invoice.balanceAmount || 0).toLocaleString('en-IN')}</p>
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
                  <p className="font-black text-gray-900 uppercase tracking-tight">{invoice.partyName || 'N/A'}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase mb-1">Address</span>
                  <p className="text-sm font-medium text-gray-600 whitespace-pre-line leading-relaxed">{invoice.billingAddress || 'No address provided'}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-50 transition-all">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">State of Supply</span>
                    <p className="text-sm font-bold text-gray-800">{invoice.stateOfSupply || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Payment Method</span>
                    <p className="text-sm font-bold text-gray-800">{invoice.paymentMethod || 'Cash'}</p>
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
                  {invoice.items.map((item, index) => (
                    <tr key={item._id || index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-gray-800 uppercase tracking-tight">{item.name}</td>
                      <td className="px-6 py-4 text-center text-xs text-gray-500 font-medium">{item.hsn || 'N/A'}</td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-gray-800">{item.qty}</td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase">{item.unit || 'PCS'}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium">₹{(item.rate || 0).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-right text-xs text-blue-600 font-bold">{item.discount || 0}%</td>
                      <td className="px-6 py-4 text-right text-xs text-orange-600 font-bold">{item.gstRate || item.tax || 0}%</td>
                      <td className="px-6 py-4 text-right text-sm font-black text-gray-900">₹{(item.amount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-50">
              {invoice.items.map((item, index) => (
                <div key={item._id || index} className="p-4 space-y-3">
                  <div className="text-sm font-black text-gray-900 uppercase tracking-tight leading-tight">{item.name}</div>
                  <div className="grid grid-cols-2 gap-y-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Qty / Unit</span>
                      <span className="text-xs font-bold text-gray-700">{item.qty} {item.unit || 'PCS'}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Rate</span>
                      <span className="text-xs font-bold text-gray-700">₹{(item.rate || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Tax / Disc</span>
                      <span className="text-[10px] font-bold">
                        <span className="text-blue-600">{item.discount || 0}% Disc</span>
                        <span className="mx-1 text-gray-200">|</span>
                        <span className="text-orange-600">{item.tax || 0}% GST</span>
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Amount</span>
                      <span className="text-sm font-black text-gray-900">₹{(item.amount || 0).toLocaleString('en-IN')}</span>
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
                  <span className="font-bold text-gray-800">₹{(invoice.subtotal || 0).toLocaleString('en-IN')}</span>
                </div>
                {invoice.overallDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Discount:</span>
                    <span className="font-bold text-red-600">-₹{(invoice.overallDiscount || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {invoice.additionalCharges > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Additional Charges:</span>
                    <span className="font-bold text-green-600">+₹{(invoice.additionalCharges || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {(invoice.gstEnabled || (invoice.gstAmount > 0)) && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Taxable Amount:</span>
                      <span className="font-bold text-gray-700">₹{(invoice.taxableAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {invoice.igst > 0 ? (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">IGST ({invoice.gstRate}%):</span>
                        <span className="font-bold text-orange-600">₹{(invoice.igst || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">CGST ({invoice.gstRate / 2}%):</span>
                          <span className="font-bold text-orange-600">₹{(invoice.cgst || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">SGST ({invoice.gstRate / 2}%):</span>
                          <span className="font-bold text-orange-600">₹{(invoice.sgst || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    )}
                  </>
                )}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center bg-gray-900 p-4 rounded-xl text-white shadow-lg overflow-hidden relative">
                    <div className="relative z-10 flex-1 min-w-0">
                      <div className="text-[10px] font-black uppercase opacity-60 tracking-[2px]">Grand Total</div>
                      <div className="text-xl sm:text-2xl font-black truncate">₹{(invoice.totalAmount || 0).toLocaleString('en-IN')}</div>
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