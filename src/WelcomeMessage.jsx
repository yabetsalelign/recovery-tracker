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
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-peach-500 via-orange-400 to-pink-600 animate-gradient">
        {/* Background Animation */}
        <div className="absolute inset-0 bg-[url('https://via.placeholder.com/1500x800?text=Subtle+Pattern')] bg-repeat opacity-10"></div>
        {/* Content */}
        <div className="p-6 max-w-3xl mx-auto relative z-10 text-center pt-24">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-fade-in">
            🌱 Welcome, {name}!
          </h1>
          <p className="text-lg text-white mb-8 animate-fade-in delay-200">
            You’ve taken your first step. Keep showing up for yourself. You’re doing better than you think.
          </p>
          <p className="text-lg text-white italic mb-8 animate-fade-in delay-400">{randomAffirmation}</p>
          <div className="flex justify-center">
            <button
              onClick={onProceed}
              className="mt-6 px-6 py-3 text-lg rounded-full font-semibold bg-white text-peach-600 hover:bg-peach-100 transition-colors duration-300 transform transition-all duration-500 ease-in-out hover:scale-105 shadow-lg"
              aria-label="Proceed to recovery tracker"
            >
              Proceed to Tracker
            </button>
          </div>
          {/* Animated Progress Circle (Optional) */}
          <div className="mt-8 w-24 h-24 mx-auto border-4 border-t-peach-500 border-b-transparent rounded-full animate-spin-slow"></div>
        </div>
      </div>
    </Layout>
  );
};

// CSS in a separate file or style tag
const styles = `
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 15s ease infinite;
  }
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.6s ease-out forwards;
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin-slow {
    animation: spin-slow 2s linear infinite;
  }
`;
// Add styles via a <style> tag or CSS file (e.g., index.css)