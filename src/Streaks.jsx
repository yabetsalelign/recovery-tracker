import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";

const Streaks = () => {
  const [trackers] = useState(() => {
    const saved = localStorage.getItem("trackers");
    return saved ? JSON.parse(saved) : [];
  });
  const navigate = useNavigate();
  const addictions = JSON.parse(localStorage.getItem("addictions")) || [];

  const calculateStreak = (checkIns) => {
    let streak = 0;
    const dates = Object.keys(checkIns).sort((a, b) => new Date(b) - new Date(a));
    for (let date of dates) {
      if (checkIns[date]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const streaks = trackers
    .filter((tracker) => addictions.includes(tracker.name))
    .map((tracker) => calculateStreak(tracker.checkIns));

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto rounded-2xl mt-10">
        <h1 className="text-4xl font-pacifico text-center mb-6 text-peach-800 drop-shadow-md">🎉 Your Streaks!</h1>
        {addictions.length === 0 ? (
          <p className="text-center text-coral-600 text-lg">Add an addiction to see your streaks! 🌱</p>
        ) : (
          <div className="space-y-6">
            {addictions.map((addiction, index) => {
              const streak = streaks[index] || 0;
              const milestoneMessage = streak >= 30
                ? "Amazing! 🌟 A month of strength!"
                : streak >= 7
                ? "Great job! 🎈 A week of progress!"
                : streak >= 1
                ? "Keep it up! 🌼 One day at a time!"
                : "Start today for a fresh beginning! 🌸";
              return (
                <div key={addiction} className="p-6 bg-white bg-opacity-80 border-4 border-peach-300 rounded-2xl shadow-xl transform hover:scale-105 transition duration-300">
                  <h2 className="text-2xl font-pacifico text-peach-800 mb-2">{addiction}</h2>
                  <p className="text-xl text-coral-600 font-bold mb-2">Streak: {streak} days!</p>
                  <p className="text-md text-coral-600 italic">{milestoneMessage}</p>
                </div>
              );
            })}
          </div>
        )}
        <button
          onClick={() => {
            console.log("Navigating to /progress");
            navigate("/progress");
          }}
          className="mt-6 w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-500 text-white hover:bg-peach-600"
          aria-label="Back to progress"
        >
          Back to Progress
        </button>
      </div>
    </Layout>
  );
};

export default Streaks;