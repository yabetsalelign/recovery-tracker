
import React, { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  subMonths,
  addMonths,
} from "date-fns";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import { motion } from "framer-motion"; // For enhanced animations

const SeshPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [seshData, setSeshData] = useState(() => {
    const saved = localStorage.getItem("seshData");
    return saved ? JSON.parse(saved) : {};
  });
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("seshData", JSON.stringify(seshData));
  }, [seshData]);

  const daysThisMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const handleDayClick = (dateStr) => {
    const newCount = prompt("Enter number of sesh for this day:", seshData[dateStr] || 0);
    if (newCount !== null) {
      const count = parseInt(newCount) || 0;
      setSeshData((prev) => ({
        ...prev,
        [dateStr]: count,
      }));
    }
  };

  // Surprise: Calculate streak for milestone glow
  const calculateStreak = () => {
    const checkIns = {};
    Object.keys(seshData).forEach((date) => {
      checkIns[date] = seshData[date] === 0;
    });
    let streak = 0;
    const dates = Object.keys(checkIns).sort((a, b) => new Date(b) - new Date(a));
    for (let date of dates) {
      if (checkIns[date] && isSameDay(new Date(date), new Date())) {
        streak++;
      } else if (checkIns[date]) {
        break;
      }
    }
    return streak;
  };
  const streak = calculateStreak();
  const [showMilestone, setShowMilestone] = useState(false);

  useEffect(() => {
    if (streak >= 3) setShowMilestone(true); // Milestone glow at 3-day streak
  }, [streak]);

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto rounded-xl mt-10" style={{ backgroundColor: '#2A403F' }}>
        <h1 className="text-3xl font-bold text-center mb-6 text-orange-500 animate-pulse">
          🚬 Sesh Tracker: Reflect & Rise 🚬
        </h1>

        <motion.div
          className="bg-gray-900/80 p-6 rounded-lg shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="flex justify-between mb-4">
            <motion.button
              onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
              className="px-3 py-1 text-sm rounded-md font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors duration-200 transform hover:shadow-md"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              Previous
            </motion.button>
            <h2 className="text-xl font-semibold text-white drop-shadow-lg">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <motion.button
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
              className="px-3 py-1 text-sm rounded-md font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors duration-200 transform hover:shadow-md"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              Next
            </motion.button>
          </div>

          <motion.div
            className="grid grid-cols-7 gap-2 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <motion.div
                key={day}
                className="text-center font-semibold text-sm text-white bg-gray-700/50 rounded-full p-2 shadow-inner"
                whileHover={{ scale: 1.05, backgroundColor: "#4B5E58" }}
              >
                {day}
              </motion.div>
            ))}
            {daysThisMonth.map((dateObj) => {
              const dateStr = format(dateObj, "yyyy-MM-dd");
              const isToday = isSameDay(dateObj, new Date());
              const seshCount = seshData[dateStr] || 0;
              const emoji = seshCount > 0 ? ` 🚬${seshCount}` : "✅";

              return (
                <motion.button
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={`rounded-lg h-12 flex items-center justify-center text-sm font-medium border 
                    ${isToday ? "bg-orange-200 border-orange-400" : seshCount > 0 ? "bg-orange-100 border-transparent" : "bg-gray-700 border-transparent"} 
                    text-white hover:bg-opacity-100 hover:shadow-xl transition-all duration-300`}
                  animate={isToday ? { scale: [1, 1.05, 1], opacity: [1, 0.9, 1], transition: { repeat: Infinity, duration: 2 } } : {}}
                  whileHover={{ scale: 1.1, boxShadow: "0 6px 12px rgba(0, 0, 0, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  {format(dateObj, "d")}
                  {emoji}
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>

        <motion.button
          onClick={() => navigate("/home")}
          className="mt-6 w-full px-4 py-2 text-sm rounded-md font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors duration-200 transform hover:shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Home
        </motion.button>

        {showMilestone && (
          <motion.div
            className="mt-6 p-4 bg-orange-500/80 text-white rounded-lg text-center shadow-xl border-2 border-yellow-300"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, boxShadow: "0 0 15px #FFD700" }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <h2 className="text-xl font-bold">🌟 Milestone Glow!</h2>
            <p>3+ sesh-free days! Your willpower is shining! ✨</p>
            <motion.button
              onClick={() => setShowMilestone(false)}
              className="mt-2 px-3 py-1 bg-white text-orange-500 rounded-md hover:bg-gray-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              Got It!
            </motion.button>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default SeshPage;