import React, { useEffect } from "react";
import { X } from "lucide-react";

type SnackbarProps = {
  isOpen: boolean;
  message: string;
  onClose: () => void;
};

const CustomSnackbar: React.FC<SnackbarProps> = ({ isOpen, message, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="tw-fixed tw-bottom-6 tw-right-6 tw-z-50 tw-flex tw-items-center tw-gap-3 tw-bg-gray-900/95 dark:tw-bg-gray-800/95 tw-backdrop-blur-md tw-text-white tw-px-4 tw-py-3 tw-rounded-2xl tw-shadow-2xl tw-border tw-border-gray-700/80 tw-transition-all">
      <span className="tw-text-sm tw-font-medium">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="tw-text-gray-400 hover:tw-text-white tw-p-1 tw-rounded-lg tw-transition-colors"
      >
        <X className="tw-w-4 tw-h-4" />
      </button>
    </div>
  );
};

export default CustomSnackbar;