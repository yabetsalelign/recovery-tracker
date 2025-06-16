import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";

const Day = () => {
  const [trackers, setTrackers] = useState(() => {
    const saved = localStorage.getItem("trackers");
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const selectedDate = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");

  const addictions = JSON.parse(localStorage.getItem("addictions") || "[]");
  const loadedTrackers = JSON.parse(localStorage.getItem("trackers") || "[]");

  useEffect(() => {
    const validTrackers = loadedTrackers.length
      ? loadedTrackers.filter((tracker) => addictions.includes(tracker.name))
      : addictions.map((name, index) => ({ id: index + 1, name, checkIns: {}, notes: {} }));

    if (JSON.stringify(trackers) !== JSON.stringify(validTrackers)) {
      setTrackers(validTrackers);
      localStorage.setItem("trackers", JSON.stringify(validTrackers));
    }
    setLoading(false);
  }, [addictions]);

  const toggleCheck = (id, date) => {
    setTrackers((prev) => {
      const updatedTrackers = prev.map((tracker) => {
        if (tracker.id !== id) return tracker;
        const newCheckIns = { ...tracker.checkIns };
        newCheckIns[date] = !(newCheckIns[date] || false);
        return { ...tracker, checkIns: newCheckIns };
      });
      localStorage.setItem("trackers", JSON.stringify(updatedTrackers));
      return updatedTrackers;
    });
  };

  if (loading) return <div className="text-center text-gray-800">Loading...</div>;

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto rounded-xl mt-10">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-800">Recovery Tracker - {selectedDate} </h1>
        <div className="bg-gradient-to-br from-peach-500 to-orange-600 p-6 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out hover:scale-105">
          {trackers.length === 0 ? (
            <p className="text-center text-gray-800">
              No active addictions to track. Add one on the Home page!
            </p>
          ) : (
            trackers.map(({ id, name, checkIns }) => (
              <div
                key={id}
                className="mb-6 p-4 bg-peach-100 rounded-lg shadow-sm border border-peach-300"
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold text-gray-800">{name}</h2>
                  <button
                    onClick={() => toggleCheck(id, selectedDate)}
                    className={`px-3 py-1 text-sm rounded-md font-medium ${
                      checkIns[selectedDate]
                        ? "bg-green-500 text-white"
                        : "bg-peach-300 text-gray-800"
                    
                    } : "bg-blue-300 hover:bg-blue-400 text-gray-800 dark:text-gray-200"`}
                  
                  >
                    {checkIns[selectedDate] ? "✅ Checked in" : "Check in"}
                  </button>
                </div>
                <p className="text-sm text-gray-800 mb-2">
                  Status: {checkIns[selectedDate] ? "Checked in" : "Not checked in"} on {selectedDate}
                </p>
              </div>
            ))
          )}
        </div>
        <button
          onClick={() => navigate("/calendar")}
          className="mt-6 w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200"
          aria-label="Back to calendar"
        >
          Back to Calendar
        </button>
      </div>
    </Layout>
  );
};

export default Day;