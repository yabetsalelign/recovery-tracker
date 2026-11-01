import React from "react";
import TrackerDetail from "./components/TrackerDetail";
import Layout from "./components/Layout";
import { useRecovery } from "./context/RecoveryContext";
const WeedPage: React.FC = () => {
  const { canonicalTrackers } = useRecovery();
  const tracker = canonicalTrackers.find((item) => item.name.toLowerCase() === "weed");
  return tracker ? <TrackerDetail tracker={tracker} /> : <Layout><main className="max-w-2xl mx-auto px-4 py-10"><h1 className="font-serif text-3xl">Weed tracker not found</h1><p className="mt-2 text-[#78564F] dark:text-[#A99A8F]">There is no canonical Weed tracker in this recovery journal.</p></main></Layout>;
};
export default WeedPage;
