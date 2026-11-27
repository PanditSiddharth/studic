"use client";
import { IProduct } from "@/modals/product.model";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { downloadLink } from "../product/download-product";

export const showTransactionDetails = (transaction: Partial<IProduct> & { transactionId?: string } | null,
  pathname: string
) => {
  if (!transaction) return;
  
  toast.dismiss();
  toast(
    <div className="p-4 max-w-lg rounded-lg shadow-lg bg-white text-gray-900">
      <h3 className="text-lg font-semibold text-green-600 mb-2">Payment Successful</h3>
      <p className="text-sm mb-4">
        Thank you for your purchase! Your payment was processed successfully.
      </p>
      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm">
          <strong>Title :</strong> {transaction?.title}
        </p>
        <p className="text-sm">
          <strong>Transaction ID:</strong><br/> {transaction.transactionId}
        </p>
      </div>
      <div className="mt-4 flex gap-3">
        <button
          className="bg-gray-300 text-gray-800 px-4 py-1.5 rounded-lg font-semibold hover:bg-gray-400"
          onClick={() => {toast.dismiss(); window.history.replaceState(null, "", pathname.replace(/\?tid\=.*/, "")) }}
        >
          Close
        </button>
        <button
          className="bg-green-500 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-green-600"
          onClick={async () => {
           
           await downloadLink(transaction?.fileLink + "")
          }}
        >
          Download
        </button>
      </div>
    </div>,
    {
      closeButton: false,
      autoClose: false,
      position: "top-center",
      className: "custom-toast",
    }
  );
};
