import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import TrackerDetail from "../components/TrackerDetail";
import { useRecovery } from "../context/RecoveryContext";
import { resolveTrackerById } from "../utils/unifiedCalculations";

const TrackerPage: React.FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { canonicalTrackers } = useRecovery();
  const tracker = resolveTrackerById(canonicalTrackers, id);
  if (!tracker) return <Layout><main className="max-w-2xl mx-auto px-4 py-10 space-y-4"><h1 className="font-serif text-3xl">Tracker not found</h1><p className="text-[#78564F] dark:text-[#A99A8F]">This tracker may have been removed or the link may be incomplete.</p><button type="button" onClick={() => navigate("/home")} className="btn-primary">Back to home</button></main></Layout>;
  return <TrackerDetail tracker={tracker} />;
};
export default TrackerPage;
