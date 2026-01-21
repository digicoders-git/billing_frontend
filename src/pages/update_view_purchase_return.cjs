const fs = require('fs');
const path = 'c:\\Users\\pc\\OneDrive\\Desktop\\Billing_Soft\\frontend\\src\\pages\\ViewPurchaseReturn.jsx';

try {
    let content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');
    
    // Find lines
    let startIndex = -1;
    let endIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        // Target: <div className="border-t border-gray-100 overflow-x-auto">
        if (lines[i].includes('className="border-t border-gray-100 overflow-x-auto"')) {
            startIndex = i;
        }
        // Target end: </table> followed by </div>
        if (startIndex !== -1 && lines[i].includes('</table>')) {
            if (i+1 < lines.length && lines[i+1].includes('</div>')) {
                endIndex = i + 1;
                break;
            }
        }
    }

    if (startIndex !== -1 && endIndex !== -1) {
        console.log(`Found block: ${startIndex + 1} to ${endIndex + 1}`);
        
        const mobileView = `                  {/* Mobile View */}
                  <div className="md:hidden divide-y divide-gray-50 border-t border-gray-100">
                      {returnData.items.map((item, index) => (
                          <div key={index} className="p-4 space-y-3">
                              <div className="flex justify-between items-start gap-2">
                                  <div className="text-sm font-black text-gray-900 uppercase tracking-tight leading-tight">{item.name}</div>
                                  <div className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">#{index + 1}</div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-y-2">
                                  <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-gray-400 uppercase">Qty</span>
                                      <span className="text-xs font-bold text-gray-700">{item.qty} {item.unit}</span>
                                  </div>
                                  <div className="flex flex-col items-end">
                                      <span className="text-[10px] font-bold text-gray-400 uppercase">Rate</span>
                                      <span className="text-xs font-bold text-gray-700">₹{item.rate.toLocaleString()}</span>
                                  </div>
                                  {item.hsn && (
                                      <div className="col-span-2">
                                          <span className="text-[10px] font-bold text-gray-400 uppercase mr-2">HSN:</span>
                                          <span className="text-[10px] font-bold text-gray-600">{item.hsn}</span>
                                      </div>
                                  )}
                                  
                                  <div className="col-span-2 pt-2 border-t border-gray-50 flex justify-between items-center mt-1">
                                      <span className="text-[10px] font-bold text-gray-400 uppercase">Amount</span>
                                      <span className="text-sm font-black text-gray-900">₹{item.amount.toLocaleString()}</span>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>`;
        
        // Construct new desktop view div with hidden md:block
        let originalTableBlock = lines.slice(startIndex, endIndex + 1).join('\n');
        // Replace outer div className
        let newTableBlock = originalTableBlock.replace('className="border-t border-gray-100 overflow-x-auto"', 'className="hidden md:block border-t border-gray-100 overflow-x-auto"');
        
        let finalContent = mobileView + '\n\n' + newTableBlock;
        
        lines.splice(startIndex, endIndex - startIndex + 1, finalContent);
        
        fs.writeFileSync(path, lines.join('\n'), 'utf8');
        console.log('Successfully updated ViewPurchaseReturn.jsx');
    } else {
        console.log('Could not find the block to replace');
    }
} catch (e) {
    console.error(e);
}
