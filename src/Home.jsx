import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import { motion, AnimatePresence } from "framer-motion";

const Home = () => {
  const [addictions, setAddictions] = useState(() => {
    const saved = localStorage.getItem("addictions");
    return saved ? JSON.parse(saved) : [];
  });

  const [hasSesh, setHasSesh] = useState(() => {
    const savedAddictions = JSON.parse(localStorage.getItem("addictions") || "[]");
    return savedAddictions.includes("sesh");
  });

  const [hasWeed, setHasWeed] = useState(() => {
    const savedAddictions = JSON.parse(localStorage.getItem("addictions") || "[]");
    return savedAddictions.includes("weed");
  });

  const [hasPorn, setHasPorn] = useState(() => {
    const savedAddictions = JSON.parse(localStorage.getItem("addictions") || "[]");
    return savedAddictions.includes("porn");
  });

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("addictions", JSON.stringify(addictions));
    setHasSesh(addictions.includes("sesh"));
    setHasWeed(addictions.includes("weed"));
    setHasPorn(addictions.includes("porn"));
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
    if (addictionToDelete.toLowerCase() === "weed") {
      localStorage.removeItem("hasWeed");
      localStorage.removeItem("weedData");
    }
    if (addictionToDelete.toLowerCase() === "porn") {
      localStorage.removeItem("hasPorn");
      localStorage.removeItem("pornData");
    }
  };

  const checkJourneyBeacon = () => {
    const tracked = ["sesh", "weed", "porn"].filter((a) => addictions.includes(a));
    return tracked.length >= 3;
  };

  const [showBeacon, setShowBeacon] = useState(checkJourneyBeacon());

  useEffect(() => {
    setShowBeacon(checkJourneyBeacon());
  }, [addictions]);

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto rounded-xl mt-10">
        <h1
          className="text-4xl font-extrabold text-center mb-8 text-green-800 neon-text animate-pulse"
          style={{
            textShadow:
              "0 0 6px #FFD700, 0 0 12px #FFD700, 0 0 18px #FFD700",
            animationDuration: "1.2s",
          }}
        >
          Recovery Command Center
        </h1>

        <motion.div
          className="bg-gradient-to-br from-peach-500 to-orange-600 via-red-400 p-8 rounded-xl shadow-2xl transform transition-all duration-500 ease-in-out hover:shadow-neon relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.button
            onClick={() => navigate("/add-addiction")}
            className="w-full px-6 py-3 mb-4 text-lg font-semibold bg-gradient-to-r from-peach-300 to-orange-400 text-gray-900 rounded-lg hover:from-peach-400 hover:to-orange-500 transition-all duration-300 shadow-md hover:shadow-lg"
            whileHover={{ scale: 1.1, boxShadow: "0 0 15px #FDBA74" }}
            whileTap={{ scale: 0.98 }}
          >
            Launch Addiction
          </motion.button>

          <motion.button
            onClick={() => navigate("/calendar")}
            className="w-full px-6 py-3 mb-4 text-lg font-semibold bg-gradient-to-r from-peach-300 to-orange-400 text-gray-900 rounded-lg hover:from-peach-400 hover:to-orange-500 transition-all duration-300 shadow-md hover:shadow-lg"
            whileHover={{ scale: 1.1, boxShadow: "0 0 15px #FDBA74" }}
            whileTap={{ scale: 0.98 }}
          >
            Initiate Tracking
          </motion.button>

          <motion.button
            onClick={() => navigate("/notes")}
            className="w-full px-6 py-3 mb-4 text-lg font-semibold bg-gradient-to-r from-peach-300 to-orange-400 text-gray-900 rounded-lg hover:from-peach-400 hover:to-orange-500 transition-all duration-300 shadow-md hover:shadow-lg"
            whileHover={{ scale: 1.1, boxShadow: "0 0 15px #FDBA74" }}
            whileTap={{ scale: 0.98 }}
          >
            Access Journal
          </motion.button>

          {hasSesh && (
            <motion.button
              onClick={() => navigate("/sesh")}
              className="w-full px-6 py-3 mb-4 text-lg font-semibold bg-gradient-to-r from-peach-300 to-orange-400 text-gray-900 rounded-lg hover:from-peach-400 hover:to-orange-500 transition-all duration-300 shadow-md hover:shadow-lg"
              whileHover={{ scale: 1.1, boxShadow: "0 0 15px #FDBA74" }}
              whileTap={{ scale: 0.98 }}
            >
              Monitor Sesh
            </motion.button>
          )}

          {hasWeed && (
            <motion.button
              onClick={() => navigate("/weed")}
              className="w-full px-6 py-3 mb-4 text-lg font-semibold bg-gradient-to-r from-peach-300 to-orange-400 text-gray-900 rounded-lg hover:from-peach-400 hover:to-orange-500 transition-all duration-300 shadow-md hover:shadow-lg"
              whileHover={{ scale: 1.1, boxShadow: "0 0 15px #FDBA74" }}
              whileTap={{ scale: 0.98 }}
            >
              Track Weed
            </motion.button>
          )}

          {hasPorn && (
            <motion.button
              onClick={() => navigate("/porn")}
              className="w-full px-6 py-3 mb-4 text-lg font-semibold bg-gradient-to-r from-peach-300 to-orange-400 text-gray-900 rounded-lg hover:from-peach-400 hover:to-orange-500 transition-all duration-300 shadow-md hover:shadow-lg"
              whileHover={{ scale: 1.1, boxShadow: "0 0 15px #FDBA74" }}
              whileTap={{ scale: 0.98 }}
            >
              Log Porn
            </motion.button>
          )}

          {addictions.length > 0 && (
            <motion.div
              className="mt-6 text-center text-gray-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-xl font-semibold mb-2">Active Missions:</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {addictions.map((addiction) => (
                  <motion.span
                    key={addiction}
                    className="px-3 py-1 bg-orange-200/70 text-gray-900 rounded-full text-sm font-medium hover:bg-orange-300 transition-colors duration-200 cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteAddiction(addiction)}
                  >
                    {addiction} ✗
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence>
          {showBeacon && (
            <motion.div
              className="mt-6 p-5 bg-green-600/80 text-white rounded-xl text-center shadow-2xl border-2 border-green-400"
              initial={{ opacity: 0, scale: 0.7, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0, boxShadow: "0 0 25px #16A34A" }}
              exit={{ opacity: 0, scale: 0.7, y: 30 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
            >
              <h2 className="text-2xl font-bold">🌠 Journey Beacon Activated!</h2>
              <p className="text-lg mt-2">You’re a trailblazer with 3+ addictions tracked! Keep shining!</p>
              <motion.div
                className="mt-3 flex justify-center space-x-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.svg
                  className="w-6 h-6 text-yellow-400 animate-spin-slow"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                </motion.svg>
                <motion.button
                  onClick={() => setShowBeacon(false)}
                  className="px-4 py-2 bg-white text-green-600 rounded-md hover:bg-gray-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Acknowledge
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Home;
