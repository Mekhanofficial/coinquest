// src/components/ui/modal.jsx
import React from "react";

export function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal content */}
        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalContent({ children }) {
  return (
    <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
      {children}
    </div>
  );
}

export function ModalHeader({ children }) {
  return (
    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
      {children}
    </h3>
  );
}

export function ModalBody({ children }) {
  return <div className="mt-2">{children}</div>;
}

export function ModalFooter({ children }) {
  return (
    <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
      {children}
    </div>
  );
}
