"use client";
import { useEffect } from "react";

type ErrorModalProps = {
  message: string;
  onClose: () => void;
};

export default function ErrorModal({ message, onClose }: ErrorModalProps) {
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center space-y-4">
        <h2 className="text-lg font-semibold text-red-600">Ocurrió un error</h2>
        <p className="text-gray-700">{message}</p>
        <button
          onClick={onClose}
          className="mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}