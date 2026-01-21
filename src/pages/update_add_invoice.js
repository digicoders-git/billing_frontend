const fs = require('fs');
const path = 'c:\\Users\\pc\\OneDrive\\Desktop\\Billing_Soft\\frontend\\src\\pages\\AddInvoice.jsx';

try {
    let content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');
    
    let startIndex = -1;
    let endIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('className="md:hidden space-y-3 p-4"')) {
            startIndex = i;
        }
        if (startIndex !== -1 && lines[i].includes('</div>')) {
            // we look for the one before "Desktop Table"
             if (i + 4 < lines.length) {
                let context = lines.slice(i, i+6).join('');
                if (context.includes('Desktop Table')) {
                     endIndex = i;
                     break; 
                }
             }
        }
    }

    if (startIndex !== -1 && endIndex !== -1) {
        console.log(`Found block: ${startIndex + 1} to ${endIndex + 1}`);
        
        const newBlock = `                <div className="md:hidden space-y-3 p-4">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">ITEM {index + 1}</span>
                            <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={16} /></button>
                        </div>
                        
                        <div 
                           className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-900"
                           onClick={() => {
                               setActiveItemIndex(index);
                               setShowItemPicker(true);
                           }}
                        >
                           {item.name || <span className="text-gray-400 italic font-medium">Tap to select item...</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                           <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">HSN</label>
                              <input 
                                type="text" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium outline-none focus:border-indigo-500 transition-all uppercase"
                                placeholder="HSN" 
                                value={item.hsn} 
                                onChange={(e) => updateItem(item.id, 'hsn', e.target.value)} 
                              />
                           </div>
                           <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">MRP</label>
                              <input 
                                type="number" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium outline-none focus:border-indigo-500 transition-all"
                                placeholder="0" 
                                value={item.mrp || ''} 
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updateItem(item.id, 'mrp', e.target.value)} 
                              />
                           </div>
                           <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Qty</label>
                              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-2">
                                <input 
                                    type="number" 
                                    className="w-full bg-transparent border-none outline-none text-xs font-bold text-indigo-600"
                                    placeholder="1" 
                                    value={item.qty} 
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => updateItem(item.id, 'qty', e.target.value)} 
                                />
                                <span className="text-[8px] font-bold text-gray-400 uppercase">{item.unit || 'PCS'}</span>
                              </div>
                           </div>
                           <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Rate</label>
                              <input 
                                type="number" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium outline-none focus:border-indigo-500 transition-all"
                                placeholder="0" 
                                value={item.rate} 
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updateItem(item.id, 'rate', e.target.value)} 
                              />
                           </div>
                           <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">GST</label>
                              <select 
                                value={item.gstRate} 
                                onChange={(e) => updateItem(item.id, 'gstRate', e.target.value)} 
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium outline-none focus:border-indigo-500 transition-all uppercase"
                              >
                                {gstOptions.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                           </div>
                           <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Disc %</label>
                              <input 
                                type="number" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium outline-none focus:border-indigo-500 transition-all"
                                placeholder="0" 
                                value={item.discount} 
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updateItem(item.id, 'discount', e.target.value)} 
                              />
                           </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Amount</span>
                            <span className="text-base font-bold text-indigo-600">₹ {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                  ))}
                   {formData.items.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-gray-400 text-xs font-medium">No items added</p>
                            <button onClick={addItem} className="mt-2 text-indigo-600 text-xs font-bold uppercase tracking-wide">Tap to Add Item</button>
                        </div>
                   )}
                </div>`;

        // Replace the lines
        lines.splice(startIndex, endIndex - startIndex + 1, newBlock);
        
        fs.writeFileSync(path, lines.join('\n'), 'utf8');
        console.log('Successfully updated AddInvoice.jsx');
    } else {
        console.log('Could not find the block to replace');
    }

} catch (e) {
    console.error('Error:', e);
}
