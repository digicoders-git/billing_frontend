import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Printer, ArrowLeft } from 'lucide-react';
import api from '../lib/axios';

// Utility to convert number to words (Indian numbering system)
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

const InvoicePDF = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const printRef = useRef();

    const [fetchedData, setFetchedData] = useState(null);
    const [loading, setLoading] = useState(!location.state);
    const [error, setError] = useState(null);

    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/users/profile');
                setUserProfile(res.data);
            } catch (err) {
                console.error("Error fetching profile for invoice header:", err);
            }
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        if (!location.state && id) {
            const fetchInvoice = async () => {
                try {
                    const response = await api.get(`/invoices/${id}`);
                    setFetchedData(response.data);
                } catch (err) {
                    console.error('Error fetching invoice for PDF:', err);
                    setError('Failed to load invoice data.');
                } finally {
                    setLoading(false);
                }
            };
            fetchInvoice();
        } else {
            setLoading(false);
        }
    }, [id, location.state]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
         return (
            <DashboardLayout>
                <div className="min-h-screen flex flex-col items-center justify-center text-red-500">
                   <p className="text-xl font-bold mb-4">{error}</p>
                   <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded text-gray-800">Go Back</button>
                </div>
            </DashboardLayout>
         );
    }

    // Use passed state or fetched data
    const invoiceData = location.state?.invoiceData || fetchedData;
    
    if (!invoiceData) {
         return (
             <DashboardLayout>
                <div className="min-h-screen flex flex-col items-center justify-center text-gray-500">
                   <p className="text-xl font-bold mb-4">Invoice not found</p>
                   <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded text-gray-800">Go Back</button>
                </div>
             </DashboardLayout>
         );
    }

    // Determine totals from data source needed for display
    // If fetched from API, these fields are directly on the invoice object
    const roundOffDiff = invoiceData.roundOffDiff || 0;
    const roundedTotal = invoiceData.totalAmount || 0;
    const balance = invoiceData.balanceAmount || 0;

    // Company Info - Dynamic from User Profile
    const company = {
        name: userProfile?.businessName || 'FAIZAN MACHINERY & AQUA CULTURE',
        address: userProfile?.address || 'BARHNI ROAD, ITWA BAZAR, SIDDHARTH NAGAR, UTTAR PRADESH, 272192',
        gstin: userProfile?.gstin || '09DWAPK9067Q1ZJ',
        mobile: userProfile?.phone || '9839280238',
        pan: userProfile?.pan || 'DWAPK9069Q', 
        email: userProfile?.email || 'fmaaquaculture@gmail.com',
        website: userProfile?.website || 'www.faizanaquaculture.in'
    };

    // Prepare data for display
    const displayInvoice = {
        number: invoiceData.invoiceNo,
        date: new Date(invoiceData.date).toLocaleDateString('en-GB'), // DD/MM/YYYY
        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString('en-GB') : '',
        billTo: {
            name: invoiceData.partyName || (invoiceData.party && invoiceData.party.name) || 'N/A',
            address: invoiceData.billingAddress || (invoiceData.party && invoiceData.party.billingAddress) || (invoiceData.party && invoiceData.party.address) || '',
            gstin: (invoiceData.party && invoiceData.party.gstin) || '',
            placeOfSupply: (invoiceData.party && invoiceData.party.placeOfSupply) || '',
            mobile: (invoiceData.party && invoiceData.party.mobile) || ''
        },
        shipTo: { 
            name: invoiceData.partyName || (invoiceData.party && invoiceData.party.name) || 'N/A', 
            address: invoiceData.billingAddress || (invoiceData.party && invoiceData.party.billingAddress) || '' 
        },
        items: invoiceData.items.map((it, idx) => ({
            sno: idx + 1,
            item: it.name || '',
            hsn: it.hsn || '-',
            qty: it.qty,
            unit: it.unit || 'PCS',
            mrp: it.mrp || it.rate,
            rate: it.rate,
            gstRate: it.gstRate || 0,
            gstAmount: it.gstAmount || 0,
            amount: it.amount
        })),
        roundOff: roundOffDiff,
        total: roundedTotal,
        balance: balance,
        amountInWords: numberToWords(roundedTotal),
        terms: (invoiceData.terms || '').split('\n').filter(t => t.trim() !== ''),
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
                        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Invoice Review & Print</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md transition-all">
                            <Printer size={18} /> Print Invoice
                        </button>
                    </div>
                </div>

                {/* Legacy Scrollable Wrapper (Reverted per user request) */}
                <div className="w-full overflow-x-auto print:overflow-visible pb-8">
                    {/* Printable Invoice Container - Visible during print */}
                    <div ref={printRef} className="mx-auto bg-white min-w-[800px] print:min-w-0 print:w-full max-w-[800px] print:max-w-none p-4 shadow-xl print:shadow-none print:p-0 my-4 print:my-0 text-gray-800" style={{ fontFamily: 'Arial, sans-serif' }}>
                        
                        {/* Top Label */}
                        <div className="flex justify-between items-center mb-1 text-[10px] font-bold">
                            <div>TAX INVOICE</div>
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
                                    <div className="text-[10px]"><strong>Invoice No.</strong><br/><span className="font-bold">{displayInvoice.number}</span></div>
                                    <div className="text-[10px]"><strong>Invoice Date</strong><br/><span className="font-bold">{displayInvoice.date}</span></div>
                                    <div className="text-[10px]"><strong>Due Date</strong><br/><span className="font-bold">{displayInvoice.dueDate}</span></div>
                                </div>
                            </div>

                            {/* Bill To / Ship To */}
                            <div className="flex border-b border-black text-[10px]">
                                <div className="w-[60%] border-r border-black p-3 space-y-1">
                                    <div className="font-bold border-b border-gray-100 pb-0.5 mb-1 w-fit text-gray-500 text-[8px] uppercase tracking-wider">BILL TO</div>
                                    <div className="font-black text-sm text-black">{displayInvoice.billTo.name}</div>
                                    <div className="text-[9px] font-medium leading-tight">{displayInvoice.billTo.address}</div>
                                    <div className="grid grid-cols-2 gap-x-4 pt-1 font-medium text-[9px]">
                                        <div><strong>GSTIN:</strong> {displayInvoice.billTo.gstin}</div>
                                        <div><strong>Place:</strong> {displayInvoice.billTo.placeOfSupply}</div>
                                        <div><strong>Mobile:</strong> {displayInvoice.billTo.mobile}</div>
                                    </div>
                                </div>
                                <div className="flex-1 p-3">
                                    <div className="font-bold border-b border-gray-100 pb-0.5 mb-1 w-fit text-gray-500 text-[8px] uppercase tracking-wider">SHIP TO</div>
                                    <div className="font-black text-sm text-black">{displayInvoice.shipTo.name}</div>
                                    <div className="text-[9px] font-medium leading-tight">{displayInvoice.shipTo.address || 'Same as Billing'}</div>
                                </div>
                            </div>

                            {/* Main Table */}
                            <table className="w-full border-collapse text-[10px]">
                                <thead className="bg-gray-50">
                                    <tr className="border-b border-black">
                                        <th className="border-r border-black px-1 py-1 w-10">S.NO.</th>
                                        <th className="border-r border-black px-2 py-1 text-center font-black tracking-widest">DESCRIPTION OF GOODS</th>
                                        <th className="border-r border-black px-2 py-1 w-20">HSN</th>
                                        <th className="border-r border-black px-2 py-1 w-16">QTY.</th>
                                        <th className="border-r border-black px-2 py-1 w-20 text-right">RATE</th>
                                        <th className="border-r border-black px-2 py-1 w-16 text-center">GST %</th>
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
                                            <td className="border-r border-black px-2 py-1.5 text-right font-medium">{item.rate.toLocaleString()}</td>
                                            <td className="border-r border-black px-2 py-1.5 text-center font-medium">{item.gstRate}%</td>
                                            <td className="px-2 py-1.5 text-right font-black">{item.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {/* Empty rows to maintain height */}
                                    {[...Array(Math.max(0, 8 - displayInvoice.items.length))].map((_, i) => (
                                        <tr key={`empty-${i}`} className="h-6 border-b border-gray-50">
                                            <td className="border-r border-black"/>
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

                            {/* Summary Rows Right */}
                            <div className="flex border-t border-black">
                                <div className="flex-1 p-2 text-[8px] italic text-gray-500 self-end">
                                    Computer Generated Invoice. No Signature Required.
                                </div>
                                <div className="w-[40%] flex flex-col font-bold text-[10px]">
                                    {/* Show GST Breakdown if GST is present */}
                                    {(invoiceData.gstEnabled || (invoiceData.gstAmount > 0)) && (
                                        <>
                                            <div className="flex justify-between px-3 py-1 border-b border-gray-200 bg-gray-50/30">
                                                <span className="italic font-medium text-gray-600">Taxable Amount</span>
                                                <span className="text-gray-900">₹ {Number(invoiceData.taxableAmount || 0).toLocaleString()}</span>
                                            </div>
                                            {invoiceData.igst > 0 ? (
                                                <div className="flex justify-between px-3 py-1 border-b border-gray-200">
                                                    <span className="italic font-medium text-blue-600">IGST ({invoiceData.gstRate}%)</span>
                                                    <span className="text-blue-600">₹ {Number(invoiceData.igst || 0).toFixed(2)}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between px-3 py-1 border-b border-gray-200">
                                                        <span className="italic font-medium text-green-600">CGST ({(invoiceData.gstRate || 0) / 2}%)</span>
                                                        <span className="text-green-600">₹ {Number(invoiceData.cgst || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between px-3 py-1 border-b border-gray-200">
                                                        <span className="italic font-medium text-green-600">SGST ({(invoiceData.gstRate || 0) / 2}%)</span>
                                                        <span className="text-green-600">₹ {Number(invoiceData.sgst || 0).toFixed(2)}</span>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                    <div className="flex justify-between px-3 py-1 border-b border-black">
                                        <span className="italic font-medium">Round Off</span>
                                        <span>{displayInvoice.roundOff > 0 ? '+' : ''}₹ {displayInvoice.roundOff}</span>
                                    </div>
                                    <div className="flex justify-between px-3 py-1.5 border-b border-black uppercase bg-gray-50">
                                        <span className="font-black text-black">GRAND TOTAL</span>
                                        <span className="text-[12px] font-black text-black">₹ {displayInvoice.total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between px-3 py-1.5 uppercase bg-black text-white">
                                        <span>BALANCE DUE</span>
                                        <span className="text-[12px] font-black">₹ {displayInvoice.balance.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Amount in words */}
                            <div className="border-t border-black p-2 text-[10px] space-y-0.5 bg-gray-50/30">
                                <div className="font-bold uppercase text-gray-400 text-[8px]">Amount Chargeable (in words)</div>
                                <div className="font-black italic text-black underline decoration-gray-300 capitalize">{displayInvoice.amountInWords}</div>
                            </div>

                            {/* Footer section: Bank, Terms, Signatory */}
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
                                        {/* Mock Stamp Placeholder */}
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
            </div>

            <style jsx>{`
                @media print {
                    /* Hide everything except the invoice container */
                    .no-print, 
                    aside, 
                    nav, 
                    header, 
                    .sidebar,
                    [role="navigation"],
                    .sticky { 
                        display: none !important; 
                    }

                    /* Reset body and main layout for printing */
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

                    /* Important: Reset DashboardLayout constraints */
                    main {
                        margin-left: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        display: block !important;
                        min-height: 0 !important;
                        height: auto !important;
                    }

                    /* Ensure the parent of children in DashboardLayout doesn't restrict width */
                    .max-w-7xl, .max-w-5xl {
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                    }

                    /* Optimize Invoice Container for A4 portrait */
                    .bg-white {
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }

                    /* Ensure content fits tightly */
                    div[ref="printRef"] {
                        padding: 0 !important;
                        margin: 0 !important;
                        page-break-inside: avoid;
                    }

                    @page {
                        size: auto;
                        margin: 5mm;
                    }

                    /* Fix for potential footer/header browser page numbers */
                    footer { display: none !important; }

                    /* Wrappers */
                    .overflow-x-auto { overflow: visible !important; display: block !important; width: 100% !important; }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default InvoicePDF;