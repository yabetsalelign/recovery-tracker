import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./context/UserContext";
import WelcomeMessage from "./WelcomeMessage";
import Layout from "./components/Layout";

const Welcome = () => {
  const { name, setName } = useContext(UserContext);
  const [showMessage, setShowMessage] = useState(!!name);
  const navigate = useNavigate();

  const handleStart = () => {
    if (name.trim()) {
      setShowMessage(true);
    }
  };

  const handleProceed = () => {
    navigate("/home");
  };

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto rounded-xl mt-10">
        {!showMessage ? (
          <>
            <h1 className="text-3xl font-bold text-center mb-6 text-peach-800">Welcome to Recovery Tracker</h1>
            <p className="text-center text-coral-600 mb-6">
              Let’s begin your journey to a healthier you! Please tell us your name.
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full p-2 border border-peach-300 rounded-md text-sm focus:ring mb-4 text-peach-800"
              aria-label="Enter your name"
            />
            <button
              onClick={handleStart}
              className="w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-500 text-white hover:bg-peach-600"
              disabled={!name.trim()}
              aria-label="Start your recovery journey"
            >
              Start Your Journey
            </button>
          </>
        ) : (
          <div className="transition-opacity duration-700 ease-in-out opacity-100">
            <WelcomeMessage name={name} onProceed={handleProceed} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Welcome;