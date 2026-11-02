import React from "react";
import { useBackNavigation } from "./BackNavigation";

interface BackButtonProps { fallback?: string; label?: string; className?: string }

const BackButton: React.FC<BackButtonProps> = ({ fallback, label = "Back", className = "" }) => {
  const { goBack } = useBackNavigation();
  return <button type="button" onClick={() => goBack(fallback)} className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full btn-secondary px-3 text-sm ${className}`}>
    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
    <span>{label}</span>
  </button>;
};

export default BackButton;
