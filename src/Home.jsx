import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";

const Home = () => {
  const [addictions, setAddictions] = useState(() => {
    const saved = localStorage.getItem("addictions");
    return saved ? JSON.parse(saved) : [];
  });
  const [hasSesh, setHasSesh] = useState(() => {
    const savedAddictions = JSON.parse(localStorage.getItem("addictions") || "[]");
    return savedAddictions.includes("sesh");
  });
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("addictions", JSON.stringify(addictions));
    setHasSesh(addictions.includes("sesh"));
  }, [addictions]);

  const handleDeleteAddiction = (addictionToDelete) => {
    setAddictions(addictions.filter((addiction) => addiction !== addictionToDelete));
    let trackers = JSON.parse(localStorage.getItem("trackers") || "[]");
    trackers = trackers.filter((tracker) => tracker.name !== addictionToDelete);
    localStorage.setItem("trackers", JSON.stringify(trackers));
    if (addictionToDelete.toLowerCase() === "sesh") {
      localStorage.removeItem("hasSesh");
      localStorage.removeItem("seshData");
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto rounded-xl mt-10">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-800">
  Recovery Tracker: Start Here!
</h1>

        <div className="bg-gradient-to-br from-peach-500 to-orange-600 p-6 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out hover:scale-105">
          <button
            onClick={() => navigate("/add-addiction")}
            className="mt-6 w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-300 text-black-800 hover:bg-peach-400 transition-colors duration-200"
            aria-label="Add new addiction"
          >
            Add New Addiction
          </button>
          <button
            onClick={() => navigate("/calendar")}
            className="mt-2 w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200"
            aria-label="Start tracking"
          >
            Start Tracking
          </button>
          <button
            onClick={() => navigate("/notes")}
            className="mt-2 w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200"
            aria-label="View notes"
          >
            View Notes
          </button>
          {hasSesh && (
            <button
              onClick={() => navigate("/sesh")}
              className="mt-2 w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200"
              aria-label="Track sesh intake"
            >
              Track Sesh Intake
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Home;
