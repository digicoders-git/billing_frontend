
import React from 'react';

// Utility to convert number to words
export const numberToWords = (num) => {
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

const PurchaseInvoicePrint = ({ invoice }) => {
    if (!invoice) return null;

    // Faizan Company Details (Hardcoded as Recipient)
    const faizanDetails = {
        name: 'FAIZAN MACHINERY & AQUA CULTURE',
        address: 'BARHNI ROAD, ITWA BAZAR, SIDDHARTH NAGAR, UTTAR PRADESH, 272192',
        gstin: '09DWAPK9067Q1ZJ',
        mobile: '9839280238',
        email: 'fmaaquaculture@gmail.com'
    };
    
    // Check if IGST applies (simple check: if first 2 chars of GSTIN are different)
    // Defaulting to "No IGST" (Intra-state) unless confirmed otherwise. 
    // Assuming 09 is UP code.
    const isInterState = invoice.party?.gstin && faizanDetails.gstin && 
                       invoice.party.gstin.substring(0, 2) !== faizanDetails.gstin.substring(0, 2);

    // Calculate Totals for Taxable, CGST, SGST, IGST
    const taxDetails = invoice.items.reduce((acc, item) => {
        const taxableValue = item.amount; // Assuming amount in item is taxable value. If it includes tax, we need to adjust.
                                           // Usually in this system, item.amount = qty * rate.
        
        let cgst = 0, sgst = 0, igst = 0;
        
        // Use item's GST rate if available, otherwise 0
        const rate = item.gstRate || 0; 

        if (isInterState) {
            igst = (taxableValue * rate) / 100;
        } else {
            cgst = (taxableValue * (rate / 2)) / 100;
            sgst = (taxableValue * (rate / 2)) / 100;
        }

        return {
            taxable: acc.taxable + taxableValue,
            cgst: acc.cgst + cgst,
            sgst: acc.sgst + sgst,
            igst: acc.igst + igst
        };
    }, { taxable: 0, cgst: 0, sgst: 0, igst: 0 });


    return (
        <div className="hidden print:block font-sans bg-white p-0 m-0 w-full">
            <div className="mx-auto bg-white p-0" style={{ fontFamily: 'Arial, sans-serif' }}>
              
              {/* Top Label */}
              <div className="flex justify-between items-center mb-1 text-[10px] font-bold">
                  <div>PURCHASE INVOICE</div>
                  <div className="border border-gray-400 px-2 py-0.5">ORIGINAL FOR RECIPIENT</div>
              </div>

              {/* Header Table */}
              <div className="border border-black overflow-hidden bg-white">
                  <div className="flex border-b border-black">
                      {/* Company Info Left (Faizan - Document Owner) */}
                      <div className="w-[60%] border-r border-black p-3 flex gap-4">
                            <div className="w-16 h-16 border-2 border-yellow-500 rounded-full flex items-center justify-center p-0.5 shrink-0">
                                <div className="w-full h-full bg-black rounded-full flex flex-col items-center justify-center text-white overflow-hidden p-0.5">
                                    <div className="text-[8px] font-black leading-none">FAIZAN</div>
                                    <div className="text-[5px] opacity-70">AQUACULTURE</div>
                                </div>
                            </div>
                          <div className="flex-1">
                              <h1 className="text-lg font-black leading-tight mb-1 text-black uppercase">{faizanDetails.name}</h1>
                              <p className="text-[9px] leading-tight mb-1 font-medium">{faizanDetails.address}</p>
                              <div className="grid grid-cols-2 text-[9px] font-medium">
                                  <div><strong>GSTIN:</strong> {faizanDetails.gstin}</div>
                                  <div><strong>Mobile:</strong> {faizanDetails.mobile}</div>
                              </div>
                              <div className="text-[9px] font-medium"><strong>Email:</strong> {faizanDetails.email}</div>
                          </div>
                      </div>
                      {/* Invoice Details Right */}
                      <div className="flex-1 p-3 grid grid-cols-1 gap-y-2 content-start">
                          <div className="text-[10px]"><strong>Invoice No.</strong><br/><span className="font-bold">{invoice.invoiceNo}</span></div>
                          <div className="text-[10px]"><strong>Invoice Date</strong><br/><span className="font-bold">{new Date(invoice.date).toLocaleDateString('en-GB')}</span></div>
                          <div className="text-[10px]"><strong>Payment Method</strong><br/><span className="font-bold uppercase">{invoice.paymentMethod}</span></div>
                      </div>
                  </div>

                  {/* Bill From / Ship To */}
                  <div className="flex border-b border-black text-[10px]">
                      <div className="w-[60%] border-r border-black p-3 space-y-1">
                          <div className="font-bold border-b border-gray-100 pb-0.5 mb-1 w-fit text-gray-500 text-[8px] uppercase tracking-wider">BILL FROM (SUPPLIER)</div>
                          <div className="font-black text-sm text-black uppercase">{invoice.partyName}</div>
                          <div className="text-[9px] font-medium leading-tight uppercase">{invoice.party ? invoice.party.address : 'Address not available'}</div>
                          <div className="grid grid-cols-2 gap-x-4 pt-1 font-medium text-[9px]">
                              <div><strong>GSTIN:</strong> {invoice.party ? invoice.party.gstin : 'N/A'}</div>
                              <div><strong>Mobile:</strong> {invoice.party ? invoice.party.mobile : 'N/A'}</div>
                          </div>
                      </div>
                      <div className="flex-1 p-3">
                          <div className="font-bold border-b border-gray-100 pb-0.5 mb-1 w-fit text-gray-500 text-[8px] uppercase tracking-wider">SHIP TO (WAREHOUSE)</div>
                          <div className="font-black text-sm text-black uppercase">{faizanDetails.name}</div>
                          <div className="text-[9px] font-medium leading-tight">Same as Company Address</div>
                      </div>
                  </div>

                  {/* Main Table */}
                  <table className="w-full border-collapse text-[10px]">
                      <thead className="bg-gray-50">
                          <tr className="border-b border-black">
                              <th className="border-r border-black px-1 py-1 w-10">S.NO.</th>
                              <th className="border-r border-black px-2 py-1 text-left font-black tracking-widest">DESCRIPTION OF GOODS</th>
                              <th className="border-r border-black px-2 py-1 w-16">HSN</th>
                              <th className="border-r border-black px-2 py-1 w-12 text-center">GST%</th>
                              <th className="border-r border-black px-2 py-1 w-12 text-center">QTY.</th>
                              <th className="border-r border-black px-2 py-1 w-20 text-right">RATE</th>
                              <th className="px-2 py-1 w-24 text-right">AMOUNT</th>
                          </tr>
                      </thead>
                      <tbody>
                          {invoice.items.map((item, i) => (
                              <tr key={i} className="border-b border-gray-100 min-h-[30px]">
                                  <td className="border-r border-black px-1 py-1.5 text-center">{i + 1}</td>
                                  <td className="border-r border-black px-2 py-1.5 font-bold uppercase">{item.name}</td>
                                  <td className="border-r border-black px-2 py-1.5 text-center font-medium">{item.hsn || '-'}</td>
                                  <td className="border-r border-black px-2 py-1.5 text-center font-medium">{item.gstRate ? `${item.gstRate}%` : '0%'}</td>
                                  <td className="border-r border-black px-2 py-1.5 text-center font-bold">{item.qty} {item.unit}</td>
                                  <td className="border-r border-black px-2 py-1.5 text-right font-medium">{item.rate.toLocaleString()}</td>
                                  <td className="px-2 py-1.5 text-right font-black">{item.amount.toLocaleString()}</td>
                              </tr>
                          ))}
                           {/* Empty rows to maintain height */}
                           {[...Array(Math.max(0, 8 - invoice.items.length))].map((_, i) => (
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
                      <div className="flex-1 p-2 text-[8px] border-r border-black flex flex-col justify-end">
                            {/* Tax Breakdown Table */}
                           <div className="mb-2">
                                <div className="font-bold underline mb-1">Tax Analysis</div>
                                <table className="w-full text-left border border-gray-300">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-1 py-0.5 border-r border-gray-300">Taxable Val</th>
                                            {isInterState ? (
                                                <th className="px-1 py-0.5 border-r border-gray-300">IGST</th>
                                            ) : (
                                                <>
                                                 <th className="px-1 py-0.5 border-r border-gray-300">CGST</th>
                                                 <th className="px-1 py-0.5 border-r border-gray-300">SGST</th>
                                                </>
                                            )}
                                            <th className="px-1 py-0.5">Total Tax</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="px-1 py-0.5 border-r border-gray-300">₹ {taxDetails.taxable.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                            {isInterState ? (
                                                <td className="px-1 py-0.5 border-r border-gray-300">₹ {taxDetails.igst.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                            ) : (
                                                <>
                                                 <td className="px-1 py-0.5 border-r border-gray-300">₹ {taxDetails.cgst.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                                 <td className="px-1 py-0.5 border-r border-gray-300">₹ {taxDetails.sgst.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                                </>
                                            )}
                                            <td className="px-1 py-0.5 font-bold">₹ {(taxDetails.igst + taxDetails.cgst + taxDetails.sgst).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                        </tr>
                                    </tbody>
                                </table>
                           </div>
                          <div className="italic text-gray-500">
                              Computer Generated Purchase Record. No Signature Required.
                          </div>
                      </div>
                      <div className="w-[40%] flex flex-col font-bold text-[10px]">
                        
                          <div className="flex justify-between px-3 py-1 border-b border-gray-200 bg-gray-50/30">
                              <span className="italic font-medium text-gray-600">Taxable Amount</span>
                              <span className="text-gray-900">₹ {invoice.subtotal.toLocaleString()}</span>
                          </div>

                           {/* Dynamic Tax Rows */}
                           {isInterState ? (
                               taxDetails.igst > 0 && (
                                <div className="flex justify-between px-3 py-1 border-b border-gray-200">
                                    <span className="italic font-medium text-gray-600">IGST</span>
                                    <span className="text-gray-900">+ ₹ {taxDetails.igst.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                </div>
                               )
                           ) : (
                            <>
                              {taxDetails.cgst > 0 && (
                                <div className="flex justify-between px-3 py-1 border-b border-gray-200">
                                    <span className="italic font-medium text-gray-600">CGST</span>
                                    <span className="text-gray-900">+ ₹ {taxDetails.cgst.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                </div>
                              )}
                              {taxDetails.sgst > 0 && (
                                <div className="flex justify-between px-3 py-1 border-b border-gray-200">
                                    <span className="italic font-medium text-gray-600">SGST</span>
                                    <span className="text-gray-900">+ ₹ {taxDetails.sgst.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                </div>
                              )}
                            </>
                           )}

                          {invoice.additionalCharges > 0 && (
                            <div className="flex justify-between px-3 py-1 border-b border-gray-200">
                                <span className="italic font-medium">Add. Charges</span>
                                <span>+ ₹ {invoice.additionalCharges.toLocaleString()}</span>
                            </div>
                          )}
                          {invoice.overallDiscount > 0 && (
                            <div className="flex justify-between px-3 py-1 border-b border-black">
                                <span className="italic font-medium text-green-600">Discount</span>
                                <span className="text-green-600">- ₹ {invoice.overallDiscount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between px-3 py-1.5 border-b border-black uppercase bg-gray-50">
                              <span className="font-black text-black">GRAND TOTAL</span>
                              <span className="text-[12px] font-black text-black">₹ {invoice.totalAmount.toLocaleString()}</span>
                          </div>
                      </div>
                  </div>

                  {/* Amount in words */}
                  <div className="border-t border-black p-2 text-[10px] space-y-0.5 bg-gray-50/30">
                      <div className="font-bold uppercase text-gray-400 text-[8px]">Amount Chargeable (in words)</div>
                      <div className="font-black italic text-black underline decoration-gray-300 capitalize">{numberToWords(invoice.totalAmount)}</div>
                  </div>

                  {/* Footer section */}
                  <div className="flex border-t border-black min-h-[100px] bg-white">
                      <div className="w-[60%] border-r border-black p-2">
                          <div className="font-bold border-b border-gray-100 pb-0.5 mb-1 text-[8px] text-gray-400 uppercase">Notes & Terms</div>
                          <div className="text-[8px] text-gray-600 whitespace-pre-line">
                              {invoice.notes || "No additional notes."}
                              <br/>
                              {invoice.terms}
                          </div>
                      </div>
                      <div className="flex-1 p-2 flex flex-col items-center justify-between text-center relative overflow-hidden">
                          <div className="h-10 w-full flex items-center justify-center opacity-10">
                             
                          </div>
                          <div className="text-[8px] font-black uppercase text-black">
                              Confirmed By <br/>
                              <div className="mt-4 pt-4 border-t border-gray-100 w-full tracking-widest">{faizanDetails.name}</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
            <style jsx>{`
            @media print {
                .no-print, aside, nav, header, .sidebar { display: none !important; }
                body, html, #root { background: white !important; margin: 0 !important; padding: 0 !important; width: 100% !important; height: auto !important; }
                main { margin: 0 !important; padding: 0 !important; width: 100% !important; }
                .max-w-5xl { max-width: none !important; margin: 0 !important; padding: 0 !important; }
                @page { size: auto; margin: 5mm; }
                footer { display: none !important; }
            }
        `}</style>
        </div>
    );
};

export default PurchaseInvoicePrint;
