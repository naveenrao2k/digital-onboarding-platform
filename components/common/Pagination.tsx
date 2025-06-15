import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10
}) => {
  // Create page buttons array 
  const getPageButtons = () => {
    const pages = [];
    
    // Always show page 1
    if (currentPage > 3) {
      pages.push(1);
      if (currentPage > 4) {
        pages.push('...');
      }
    }
    
    // Show pages around current page
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
      pages.push(i);
    }
    
    // Always show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  // Compute starting and ending item numbers
  const startItem = Math.min(totalItems || 0, (currentPage - 1) * pageSize + 1);
  const endItem = Math.min(totalItems || 0, startItem + pageSize - 1);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-sm">
      <div className="text-gray-500">
        {totalItems !== undefined && (
          <>
            Showing <span className="font-medium">{startItem}</span> to{" "}
            <span className="font-medium">{endItem}</span> of{" "}
            <span className="font-medium">{totalItems}</span> results
          </>
        )}
      </div>
      
      <div className="flex items-center space-x-1">
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`p-2 border rounded-md ${
            currentPage <= 1 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        
        {getPageButtons().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-gray-500">...</span>
            ) : (
              <button
                onClick={() => typeof page === 'number' && onPageChange(page)}
                className={`px-3 py-1 border rounded-md ${
                  page === currentPage
                    ? 'bg-primary text-white border-primary'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
        
        <button
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`p-2 border rounded-md ${
            currentPage >= totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'hover:bg-gray-50 text-gray-700'
          }`}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
