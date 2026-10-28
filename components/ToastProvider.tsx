"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "next-themes";
import { Toaster } from "@/components/ui/toaster";

export function ToastProvider() {
  const { resolvedTheme } = useTheme();
  const toastTheme = resolvedTheme === "light" ? "light" : "dark";

  return (
    <>
      <ToastContainer
        position="bottom-right"
        theme={toastTheme}
        autoClose={3500}
        closeOnClick
        pauseOnHover
        newestOnTop
        draggable
        limit={3}
        toastClassName="rounded-xl border border-border bg-card text-card-foreground shadow-lg"
      />
      <Toaster />
    </>
  );
}
