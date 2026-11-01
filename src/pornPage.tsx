import React from "react";
import TrackerDetail from "./components/TrackerDetail";
import Layout from "./components/Layout";
import { useRecovery } from "./context/RecoveryContext";
import { useTheme } from "./context/ThemeContext";
const PornPage: React.FC = () => {
  const { canonicalTrackers } = useRecovery();
  const { discreetMode } = useTheme();
  const tracker = canonicalTrackers.find((item) => item.name.toLowerCase() === "porn");
  return tracker ? <TrackerDetail tracker={discreetMode ? { ...tracker, name: "Impulse tracker" } : tracker} /> : <Layout><main className="max-w-2xl mx-auto px-4 py-10"><h1 className="font-serif text-3xl">Tracker not found</h1><p className="mt-2 text-[#78564F] dark:text-[#A99A8F]">There is no canonical Porn tracker in this recovery journal.</p></main></Layout>;
};
export default PornPage;
