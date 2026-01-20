import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
  currentPage = 1, 
  totalPages = 1, 
  itemsPerPage = 10, 
  totalItems = 0, 
  onPageChange 
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full px-2 py-4">
      {/* Results Info */}
      <div className="order-2 sm:order-1">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          Showing <span className="text-gray-900">{startItem}</span> - <span className="text-gray-900">{endItem}</span> 
          <span className="mx-2 text-gray-300">|</span> 
          Total <span className="text-indigo-600">{totalItems}</span>
        </p>
      </div>

      {/* Navigation Buttons */}
      <nav className="flex items-center gap-1 order-1 sm:order-2" aria-label="Pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-xl border transition-all duration-200 ${
            currentPage === 1 
              ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-600 hover:text-indigo-600 shadow-sm active:scale-90'
          }`}
        >
          <ChevronLeft size={18} />
        </button>
        
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 text-gray-400 font-bold italic">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page)}
                  className={`min-w-[36px] h-9 flex items-center justify-center rounded-xl text-xs font-black transition-all duration-200 ${
                    currentPage === page
                      ? 'bg-black text-white shadow-lg shadow-black/10 scale-105'
                      : 'bg-white border border-gray-200 text-gray-500 hover:border-indigo-600 hover:text-indigo-600'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-xl border transition-all duration-200 ${
            currentPage === totalPages 
              ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-600 hover:text-indigo-600 shadow-sm active:scale-90'
          }`}
        >
          <ChevronRight size={18} />
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
