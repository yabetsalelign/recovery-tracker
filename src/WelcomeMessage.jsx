import React from "react";
import Layout from "./components/Layout";

const WelcomeMessage = ({ name, onProceed }) => {
  const affirmations = [
    "One day at a time.",
    "You are not your mistakes.",
    "Small steps still move forward.",
    "You deserve peace.",
  ];
  const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto rounded-xl mt-10">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-800">🌱 Hello, {name}! </h1>
        <div className="bg-gradient-to-br from-peach-500 to-orange-600 p-6 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out hover:scale-105">
          <p className="text-center text-gray-800 mb-6">
            You’ve taken your first step, {name}. Keep showing up for yourself. You’re doing better than you think.
          </p>
          <p className="text-center text-gray-800 mt-4 italic">{randomAffirmation}</p>
          <button
            onClick={onProceed}
            className="mt-6 w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200 transform transition-all duration-500 ease-in-out hover:scale-105"
            aria-label="Proceed to recovery tracker"
          >
            Proceed to Tracker
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default WelcomeMessage;