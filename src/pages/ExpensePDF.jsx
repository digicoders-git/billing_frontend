import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Printer, ArrowLeft } from 'lucide-react';
import api from '../lib/axios';

const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n) => {
        if (n < 20) return a[n];
        let s = b[Math.floor(n / 10)];
        if (n % 10 > 0) s += ' ' + a[n % 10];
        return s;
    };

    const convert = (n) => {
        if (n === 0) return 'Zero';
        let res = '';
        if (n >= 10000000) {
            res += convert(Math.floor(n / 10000000)) + ' Crore ';
            n %= 10000000;
        }
        if (n >= 100000) {
            res += inWords(Math.floor(n / 100000)) + ' Lakh ';
            n %= 100000;
        }
        if (n >= 1000) {
            res += inWords(Math.floor(n / 1000)) + ' Thousand ';
            n %= 1000;
        }
        if (n >= 100) {
            res += inWords(Math.floor(n / 100)) + ' Hundred ';
            n %= 100;
        }
        if (n > 0) {
            if (res !== '') res += 'and ';
            res += inWords(n);
        }
        return res;
    };

    return convert(Math.floor(num)) + ' Rupees Only';
};

const ExpensePDF = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const printRef = useRef();

    const [fetchedData, setFetchedData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchExpense = async () => {
            try {
                const response = await api.get(`/expenses/${id}`);
                setFetchedData(response.data);
            } catch (err) {
                console.error('Error fetching expense for PDF:', err);
                setError('Failed to load expense data.');
            } finally {
                setLoading(false);
            }
        };
        fetchExpense();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !fetchedData) {
         return (
            <DashboardLayout>
                <div className="min-h-screen flex flex-col items-center justify-center text-red-500">
                   <p className="text-xl font-bold mb-4">{error || 'Expense not found'}</p>
                   <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded text-gray-800">Go Back</button>
                </div>
            </DashboardLayout>
         );
    }

    const expense = fetchedData;

    // Static Company Info
    const company = {
        name: 'FAIZAN MACHINERY & AQUA CULTURE',
        address: 'BARHNI ROAD, ITWA BAZAR, SIDDHARTH NAGAR, UTTAR PRADESH, 272192',
        gstin: '09DWAPK9067Q1ZJ',
        mobile: '9839280238',
        pan: 'DWAPK9069Q',
        email: 'fmaaquaculture@gmail.com',
        website: 'www.faizanaquaculture.in'
    };

    // Prepare display data
    const displayInvoice = {
        number: expense.expenseNumber,
        date: new Date(expense.date).toLocaleDateString('en-GB'),
        billTo: {
            name: expense.partyName || 'Cash Expense',
            address: expense.gstEnabled && expense.gstInNumber ? `GSTIN: ${expense.gstInNumber}` : '',
            gstin: expense.gstInNumber || '-',
            mobile: '-'
        },
        items: expense.items.map((it, idx) => ({
            sno: idx + 1,
            item: it.name || '',
            hsn: '-',
            qty: 1,
            unit: 'PCS',
            rate: it.amount,
            amount: it.amount
        })),
        total: expense.totalAmount,
        amountInWords: numberToWords(expense.totalAmount),
        terms: [
            '1. This is a computer generated expense voucher.',
            'Maintain for audit purposes.'
        ],
        bank: {
             name: 'FAIZAN MACHINERY & AQUA CULTURE',
            ifsc: 'HDFC0005168',
            accountNo: '50200073192648',
            bankName: 'HDFC Bank, ITWA'
        }
    };

    const handlePrint = () => window.print();

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-100 py-8 print:p-0 print:m-0 print:bg-white print:min-h-0">
                {/* Header Section - Hidden during print */}
                <div className="max-w-5xl mx-auto px-4 mb-6 flex justify-between items-center no-print">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-all text-gray-600">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Expense Voucher</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md transition-all">
                            <Printer size={18} /> Print Voucher
                        </button>
                    </div>
                </div>

                {/* Legacy Scrollable Wrapper (Reverted per user request) */}
                <div className="w-full overflow-x-auto print:overflow-visible pb-8">
                    {/* Printable Invoice Container */}
                    <div ref={printRef} className="mx-auto bg-white min-w-[800px] print:min-w-0 print:w-full max-w-[800px] print:max-w-none p-4 shadow-xl print:shadow-none print:p-0 my-4 print:my-0 text-gray-800" style={{ fontFamily: 'Arial, sans-serif' }}>
                        
                        {/* Top Label */}
                        <div className="flex justify-between items-center mb-1 text-[10px] font-bold">
                            <div>EXPENSE VOUCHER</div>
                            <div className="border border-gray-400 px-2 py-0.5">ORIGINAL FOR RECIPIENT</div>
                        </div>

                        {/* Header Table */}
                        <div className="border border-black overflow-hidden bg-white">
                            <div className="flex border-b border-black">
                                {/* Company Info Left */}
                                <div className="w-[60%] border-r border-black p-3 flex gap-4">
                                    <img src="/Logo.png" alt="Company Logo" className="w-20 h-20 object-contain shrink-0" />
                                    <div className="flex-1">
                                        <h1 className="text-lg font-black leading-tight mb-1 text-black">{company.name}</h1>
                                        <p className="text-[9px] leading-tight mb-1 font-medium">{company.address}</p>
                                        <div className="grid grid-cols-2 text-[9px] font-medium">
                                            <div><strong>GSTIN:</strong> {company.gstin}</div>
                                            <div><strong>Mobile:</strong> {company.mobile}</div>
                                            <div><strong>PAN Number:</strong> {company.pan}</div>
                                        </div>
                                        <div className="text-[9px] font-medium"><strong>Email:</strong> {company.email}</div>
                                        <div className="text-[9px] font-medium"><strong>Website:</strong> {company.website}</div>
                                    </div>
                                </div>
                                {/* Invoice Details Right */}
                                <div className="flex-1 p-3 grid grid-cols-1 gap-y-2 content-start">
                                    <div className="text-[10px]"><strong>Voucher No.</strong><br/><span className="font-bold">{displayInvoice.number}</span></div>
                                    <div className="text-[10px]"><strong>Date</strong><br/><span className="font-bold">{displayInvoice.date}</span></div>
                                    <div className="text-[10px]"><strong>Category</strong><br/><span className="font-bold">{expense.category}</span></div>
                                </div>
                            </div>

                            {/* Paid To */}
                            <div className="flex border-b border-black text-[10px]">
                                <div className="w-[60%] border-r border-black p-3 space-y-1">
                                    <div className="font-bold border-b border-gray-100 pb-0.5 mb-1 w-fit text-gray-500 text-[8px] uppercase tracking-wider">PAID TO</div>
                                    <div className="font-black text-sm text-black">{displayInvoice.billTo.name}</div>
                                    <div className="text-[9px] font-medium leading-tight">{displayInvoice.billTo.address}</div>
                                    <div className="grid grid-cols-2 gap-x-4 pt-1 font-medium text-[9px]">
                                        <div><strong>GSTIN:</strong> {displayInvoice.billTo.gstin}</div>
                                        <div><strong>Mobile:</strong> {displayInvoice.billTo.mobile}</div>
                                    </div>
                                </div>
                                <div className="flex-1 p-3">
                                    {/* Empty or Ship To */}
                                </div>
                            </div>

                            {/* Main Table */}
                            <table className="w-full border-collapse text-[10px]">
                                <thead className="bg-gray-50">
                                    <tr className="border-b border-black">
                                        <th className="border-r border-black px-1 py-1 w-10">S.NO.</th>
                                        <th className="border-r border-black px-2 py-1 text-center font-black tracking-widest">DESCRIPTION</th>
                                        <th className="border-r border-black px-2 py-1 w-20">HSN</th>
                                        <th className="border-r border-black px-2 py-1 w-16">QTY.</th>
                                        <th className="border-r border-black px-2 py-1 w-20 text-right">RATE</th>
                                        <th className="px-2 py-1 w-24 text-right">AMOUNT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayInvoice.items.map((item, i) => (
                                        <tr key={i} className="border-b border-gray-100 min-h-[30px]">
                                            <td className="border-r border-black px-1 py-1.5 text-center">{item.sno}</td>
                                            <td className="border-r border-black px-2 py-1.5 font-bold uppercase">{item.item}</td>
                                            <td className="border-r border-black px-2 py-1.5 text-center font-medium">{item.hsn}</td>
                                            <td className="border-r border-black px-2 py-1.5 text-center font-bold">{item.qty} {item.unit}</td>
                                            <td className="border-r border-black px-2 py-1.5 text-right font-medium">{Number(item.rate).toLocaleString()}</td>
                                            <td className="px-2 py-1.5 text-right font-black">{Number(item.amount).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {[...Array(Math.max(0, 8 - displayInvoice.items.length))].map((_, i) => (
                                        <tr key={`empty-${i}`} className="h-6 border-b border-gray-50">
                                            <td className="border-r border-black"/>
                                            <td className="border-r border-black"/>
                                            <td className="border-r border-black"/>
                                            <td className="border-r border-black"/>
                                            <td className="border-r border-black"/>
                                            <td/>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Summary Rows */}
                            <div className="flex border-t border-black">
                                <div className="flex-1 p-2 text-[8px] italic text-gray-500 self-end">
                                    Paid via {expense.paymentMode}
                                </div>
                                <div className="w-[40%] flex flex-col font-bold text-[10px]">
                                    {expense.gstEnabled && (
                                        <>
                                            <div className="flex justify-between px-3 py-1 border-b border-gray-200 bg-gray-50/30">
                                                <span className="italic font-medium text-gray-600">Taxable Amount</span>
                                                <span className="text-gray-900">₹ {Number(expense.taxableAmount || 0).toLocaleString()}</span>
                                            </div>
                                            {/* Check if we have split GST (CGST/SGST) or just total GST */}
                                            {expense.cgst !== undefined && expense.sgst !== undefined && (expense.cgst > 0 || expense.sgst > 0) ? (
                                                <>
                                                    <div className="flex justify-between px-3 py-1 border-b border-gray-200">
                                                        <span className="italic font-medium text-green-600">CGST ({(expense.gstRate || 0) / 2}%)</span>
                                                        <span className="text-green-600">₹ {Number(expense.cgst || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between px-3 py-1 border-b border-gray-200">
                                                        <span className="italic font-medium text-green-600">SGST ({(expense.gstRate || 0) / 2}%)</span>
                                                        <span className="text-green-600">₹ {Number(expense.sgst || 0).toFixed(2)}</span>
                                                    </div>
                                                </>
                                            ) : expense.igst !== undefined && expense.igst > 0 ? (
                                                <div className="flex justify-between px-3 py-1 border-b border-gray-200">
                                                    <span className="italic font-medium text-blue-600">IGST ({expense.gstRate}%)</span>
                                                    <span className="text-blue-600">₹ {Number(expense.igst || 0).toFixed(2)}</span>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between px-3 py-1 border-b border-gray-200">
                                                    <span className="italic font-medium text-blue-600">GST ({expense.gstRate}%)</span>
                                                    <span className="text-blue-600">₹ {Number(expense.gstFullAmount || 0).toFixed(2)}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <div className="flex justify-between px-3 py-1.5 uppercase bg-black text-white">
                                        <span className="font-black">GRAND TOTAL</span>
                                        <span className="text-[12px] font-black">₹ {Number(displayInvoice.total).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Amount in words */}
                            <div className="border-t border-black p-2 text-[10px] space-y-0.5 bg-gray-50/30">
                                <div className="font-bold uppercase text-gray-400 text-[8px]">Amount Chargeable (in words)</div>
                                <div className="font-black italic text-black underline decoration-gray-300 capitalize">{displayInvoice.amountInWords}</div>
                            </div>

                            {/* Footer */}
                            <div className="flex border-t border-black min-h-[100px] bg-white">
                                <div className="w-[45%] border-r border-black p-2 space-y-1">
                                    <div className="font-bold border-b border-gray-100 pb-0.5 mb-1 text-[8px] text-gray-400 uppercase">Bank Details</div>
                                    <div className="grid grid-cols-[80px_1fr] text-[9px] gap-y-0.5 font-medium">
                                        <strong>Name:</strong> <span className="uppercase">{displayInvoice.bank.name}</span>
                                        <strong>IFSC Code:</strong> <span className="uppercase">{displayInvoice.bank.ifsc}</span>
                                        <strong>Account No:</strong> <span className="font-black">{displayInvoice.bank.accountNo}</span>
                                        <strong>Bank:</strong> <span className="uppercase">{displayInvoice.bank.bankName}</span>
                                    </div>
                                </div>
                                <div className="w-[30%] border-r border-black p-2">
                                    <div className="font-bold border-b border-gray-100 pb-0.5 mb-1 text-[8px] text-gray-400 uppercase">Terms</div>
                                    <ol className="text-[8px] space-y-0.5 list-decimal list-inside font-medium text-gray-600">
                                        {displayInvoice.terms.map((term, i) => (
                                            <li key={i}>{term}</li>
                                        ))}
                                    </ol>
                                </div>
                                <div className="flex-1 p-2 flex flex-col items-center justify-between text-center relative overflow-hidden">
                                     <div className="h-10 w-full flex items-center justify-center opacity-10">
                                        <div className="border-2 border-blue-800 rounded-full w-20 h-10 flex items-center justify-center text-[6px] font-black text-blue-800 rotate-[-15deg]">FAIZAN AQUA</div>
                                    </div>
                                    <div className="text-[8px] font-black uppercase text-black">
                                        For {company.name} <br/>
                                        <div className="mt-4 pt-4 border-t border-gray-100 w-full tracking-widest">Authorized Signatory</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    @media print {
                        .no-print, aside, nav, header, .sidebar, [role="navigation"], .sticky { 
                            display: none !important; 
                        }
                        body, html {
                            background: white !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            height: 100% !important;
                            width: 100% !important;
                            overflow: visible !important;
                        }
                        #root, .min-h-screen {
                            min-height: 0 !important;
                            height: auto !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        main {
                            margin: 0 !important; padding: 0 !important; width: 100% !important; display: block !important;
                        }
                        .max-w-7xl, .max-w-5xl {
                            max-width: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important;
                        }
                        div[ref="printRef"] {
                            padding: 0 !important; margin: 0 !important; page-break-inside: avoid;
                        }
                        @page {
                            size: auto; margin: 5mm;
                        }
                        footer { display: none !important; }
                         /* Wrappers */
                        .overflow-x-auto { overflow: visible !important; display: block !important; width: 100% !important; }
                    }
                `}</style>
            </div>
        </DashboardLayout>
    );
};

export default ExpensePDF;
