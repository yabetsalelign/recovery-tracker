import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";

const AddAddiction = () => {
  const [newAddiction, setNewAddiction] = useState("");
  const [showSeshTracker, setShowSeshTracker] = useState(false);
  const [showWeedTracker, setShowWeedTracker] = useState(false);
  const [showPornTracker, setShowPornTracker] = useState(false); // New state for porn
  const [seshCount, setSeshCount] = useState(0);
  const [weedCount, setWeedCount] = useState(0);
  const [pornCount, setPornCount] = useState(0); // New state for porn count
  const [isTouched, setIsTouched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (newAddiction.trim().toLowerCase() === "sesh") {
      setShowSeshTracker(true);
    } else {
      setShowSeshTracker(false);
    }
    if (newAddiction.trim().toLowerCase() === "weed") {
      setShowWeedTracker(true);
    } else {
      setShowWeedTracker(false);
    }
    if (newAddiction.trim().toLowerCase() === "porn") { // New condition for porn
      setShowPornTracker(true);
    } else {
      setShowPornTracker(false);
    }
  }, [newAddiction]);

  const handleAddAddiction = () => {
    if (newAddiction.trim()) {
      const addictions = JSON.parse(localStorage.getItem("addictions") || "[]");
      if (!addictions.includes(newAddiction.trim())) {
        addictions.push(newAddiction.trim());
        localStorage.setItem("addictions", JSON.stringify(addictions));
      }

      if (newAddiction.trim().toLowerCase() === "sesh") {
        localStorage.setItem("hasSesh", "true");
        localStorage.setItem("seshData", "{}");
      }
      if (newAddiction.trim().toLowerCase() === "weed") {
        localStorage.setItem("hasWeed", "true");
        localStorage.setItem("weedData", "{}");
      }
      if (newAddiction.trim().toLowerCase() === "porn") { // New condition for porn
        localStorage.setItem("hasPorn", "true");
        localStorage.setItem("pornData", "{}");
      }

      setNewAddiction("");
      if (!showSeshTracker && !showWeedTracker && !showPornTracker) {
        navigate("/home");
      }
    }
  };

  const handleSeshSubmit = (e) => {
    e.preventDefault();
    if (seshCount > 0) {
      localStorage.setItem("seshData", JSON.stringify({}));
      handleAddAddiction();
      setShowSeshTracker(false);
      navigate("/home");
    }
  };

  const handleWeedSubmit = (e) => {
    e.preventDefault();
    if (weedCount > 0) {
      localStorage.setItem("weedData", JSON.stringify({}));
      handleAddAddiction();
      setShowWeedTracker(false);
      navigate("/home");
    }
  };

  const handlePornSubmit = (e) => { // New submit handler for porn
    e.preventDefault();
    if (pornCount > 0) {
      localStorage.setItem("pornData", JSON.stringify({}));
      handleAddAddiction();
      setShowPornTracker(false);
      navigate("/home");
    }
  };

  const handleTouchStart = () => {
    setIsTouched(true);
  };

  const handleTouchEnd = () => {
    setIsTouched(false);
  };

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto rounded-xl mt-10">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-800">Add New Addiction</h1>
        
        <div className="bg-gradient-to-br from-peach-500 to-orange-600 p-6 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out hover:scale-105">
          <input
            type="text"
            value={newAddiction}
            onChange={(e) => setNewAddiction(e.target.value)}
            placeholder="Enter addiction name"
            className="w-full p-2 border border-peach-300 rounded-md text-sm text-gray-800 focus:ring mb-4"
            aria-label="Enter addiction name"
          />
          <button
            onClick={handleAddAddiction}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            className={`w-full px-4 py-2 text-sm rounded-md font-medium ${
              isTouched
                ? "bg-blue-300 hover:bg-blue-400 text-gray-800"
                : "bg-peach-300 hover:bg-peach-400 text-gray-800"
            } transition-colors duration-200 transform transition-all duration-500 ease-in-out hover:scale-105`}
            disabled={!newAddiction.trim()}
            aria-label="Add addiction"
          >
            Add Addiction
          </button>
          <button
            onClick={() => navigate("/home")}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            className={`mt-2 w-full px-4 py-2 text-sm rounded-md font-medium ${
              isTouched
                ? "bg-blue-300 hover:bg-blue-400 text-gray-800"
                : "bg-peach-300 hover:bg-peach-400 text-gray-800"
            } transition-colors duration-200 transform transition-all duration-500 ease-in-out hover:scale-105`}
            aria-label="Back to home"
          >
            Back to Home
          </button>
          {showSeshTracker && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gradient-to-br from-peach-500 to-orange-600 p-6 rounded-lg shadow-lg w-96 transform transition-all duration-500 ease-in-out hover:scale-105">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">🚬 Sesh Tracker: Hidden feature Unlocked 🚬</h2>
                <p className="text-gray-800 mb-4 text-center">Enter your sesh count to conquer this addiction!</p>
                <form onSubmit={handleSeshSubmit} className="space-y-4">
                  <input
                    type="number"
                    value={seshCount}
                    onChange={(e) => setSeshCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-2 rounded-md bg-white text-gray-800 font-semibold text-center focus:outline-none focus:ring-2 focus:ring-peach-400"
                    placeholder="Number of sesh"
                    min="0"
                  />
                  <button
                    type="submit"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleTouchStart}
                    onMouseUp={handleTouchEnd}
                    className={`w-full px-4 py-2 bg-peach-300 text-gray-800 font-bold rounded-md ${
                      isTouched
                        ? "bg-blue-300 hover:bg-blue-400"
                        : "hover:bg-peach-400"
                    } transition-colors duration-200 transform transition-all duration-500 ease-in-out hover:scale-105`}
                  >
                    😮‍💨 Submit Sesh Count & Proceed!
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSeshTracker(false)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleTouchStart}
                    onMouseUp={handleTouchEnd}
                    className={`w-full px-4 py-2 bg-peach-500 text-gray-800 rounded-md ${
                      isTouched
                        ? "bg-blue-300 hover:bg-blue-400"
                        : "hover:bg-peach-600"
                    } transition-colors duration-200 transform transition-all duration-500 ease-in-out hover:scale-105`}
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          )}
          {showWeedTracker && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gradient-to-br from-peach-500 to-orange-600 p-6 rounded-lg shadow-lg w-96 transform transition-all duration-500 ease-in-out hover:scale-105">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">🍃 Weed Tracker: Hidden feature Unlocked 🍃</h2>
                <p className="text-gray-800 mb-4 text-center">Enter your daily weed intake to start</p>
                <form onSubmit={handleWeedSubmit} className="space-y-4">
                  <input
                    type="number"
                    value={weedCount}
                    onChange={(e) => setWeedCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-2 rounded-md bg-white text-gray-800 font-semibold text-center focus:outline-none focus:ring-2 focus:ring-peach-400"
                    placeholder="Number of weed"
                    min="0"
                  />
                  <button
                    type="submit"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleTouchStart}
                    onMouseUp={handleTouchEnd}
                    className={`w-full px-4 py-2 bg-peach-300 text-gray-800 font-bold rounded-md ${
                      isTouched
                        ? "bg-blue-300 hover:bg-blue-400"
                        : "hover:bg-peach-400"
                    } transition-colors duration-200 transform transition-all duration-500 ease-in-out hover:scale-105`}
                  >
                    🌿 Submit Weed Count & Proceed
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWeedTracker(false)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleTouchStart}
                    onMouseUp={handleTouchEnd}
                    className={`w-full px-4 py-2 bg-peach-500 text-gray-800 rounded-md ${
                      isTouched
                        ? "bg-blue-300 hover:bg-blue-400"
                        : "hover:bg-peach-600"
                    } transition-colors duration-200 transform transition-all duration-500 ease-in-out hover:scale-105`}
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          )}
          {showPornTracker && ( // New porn tracker modal
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gradient-to-br from-peach-500 to-orange-600 p-6 rounded-lg shadow-lg w-96 transform transition-all duration-500 ease-in-out hover:scale-105">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">🔞 Porn Tracker: Hidden feature Unlocked 🔞</h2>
                <p className="text-gray-800 mb-4 text-center">Enter your daily usage count to start</p>
                <form onSubmit={handlePornSubmit} className="space-y-4">
                  <input
                    type="number"
                    value={pornCount}
                    onChange={(e) => setPornCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-2 rounded-md bg-white text-gray-800 font-semibold text-center focus:outline-none focus:ring-2 focus:ring-peach-400"
                    placeholder="Number of instances"
                    min="0"
                  />
                  <button
                    type="submit"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleTouchStart}
                    onMouseUp={handleTouchEnd}
                    className={`w-full px-4 py-2 bg-peach-300 text-gray-800 font-bold rounded-md ${
                      isTouched
                        ? "bg-blue-300 hover:bg-blue-400"
                        : "hover:bg-peach-400"
                    } transition-colors duration-200 transform transition-all duration-500 ease-in-out hover:scale-105`}
                  >
                    📺 Submit Usage Count & Proceed
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPornTracker(false)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleTouchStart}
                    onMouseUp={handleTouchEnd}
                    className={`w-full px-4 py-2 bg-peach-500 text-gray-800 rounded-md ${
                      isTouched
                        ? "bg-blue-300 hover:bg-blue-400"
                        : "hover:bg-peach-600"
                    } transition-colors duration-200 transform transition-all duration-500 ease-in-out hover:scale-105`}
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AddAddiction;