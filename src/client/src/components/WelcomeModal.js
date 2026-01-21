import React from 'react';
import { X, CheckCircle } from 'lucide-react';

const WelcomeModal = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fadeIn">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Success icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 rounded-full p-3">
            <CheckCircle size={48} className="text-green-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
          Welcome!
        </h2>

        {/* Message content */}
        <div className="text-gray-600 text-center mb-6 whitespace-pre-line">
          {message || 'Welcome to our Tool Rental service! We are excited to have you on board.'}
        </div>

        {/* Close button at bottom */}
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;
