const fs = require('fs');
const path = 'c:\\Users\\pc\\OneDrive\\Desktop\\Billing_Soft\\frontend\\src\\pages\\EditQuotation.jsx';

try {
    let content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');
    
    let startIndex = -1;
    let endIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('className="md:hidden divide-y divide-gray-100"')) {
            startIndex = i;
        }
        if (startIndex !== -1 && lines[i].includes('</div>')) {
            // Check context for end marker
            if (i + 5 < lines.length) {
                let context = lines.slice(i, i+5).join('');
                if (context.includes('bg-gray-50/30')) {
                    endIndex = i;
                    break;
                }
            }
        }
    }

    if (startIndex !== -1 && endIndex !== -1) {
        console.log(`Found block: ${startIndex + 1} to ${endIndex + 1}`);
        // Note: EditQuotation uses simpler fields (name, qty, rate, discount, amount). No HSN, MRP, GST exposed in desktop table either.
        
        const newBlock = `                  <div className="md:hidden space-y-3 p-4">
                      {formData.items.map((item, index) => (
                          <div key={item.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-3">
                              <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase">ITEM {index + 1}</span>
                                  <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={16} /></button>
                              </div>
                              
                              <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-900">
                                  <input 
                                      type="text"
                                      className="w-full bg-transparent border-none outline-none placeholder:font-normal"
                                      placeholder="Item Name"
                                      value={item.name}
                                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                  />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
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
                                   <div>
                                      <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block text-right">Amount</label>
                                      <div className="flex items-center justify-end h-[34px] px-2">
                                        <span className="text-sm font-black text-indigo-600">₹ {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                      </div>
                                   </div>
                              </div>
                          </div>
                      ))}
                  </div>`;
        
        lines.splice(startIndex, endIndex - startIndex + 1, newBlock);
        
        fs.writeFileSync(path, lines.join('\n'), 'utf8');
        console.log('Successfully updated EditQuotation.jsx');
    } else {
        console.log('Could not find the block to replace');
    }
} catch (e) {
    console.error(e);
}
