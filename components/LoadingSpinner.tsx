'use client';

import { FaSpinner } from 'react-icons/fa';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  size = 'md', 
  message = 'Loading...',
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-gray-700 rounded-full`}></div>
        <FaSpinner 
          className={`${sizeClasses[size]} absolute top-0 left-0 animate-spin text-blue-500`} 
        />
      </div>
      {message && (
        <p className="mt-4 text-gray-400 text-sm md:text-base animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center z-50">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
}

// Inline loading spinner for small areas
export function InlineLoadingSpinner() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
      <span className="text-sm text-gray-400">Loading...</span>
    </div>
  );
}