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
import { motion } from "framer-motion";
import Layout from "./components/Layout";

const WeedPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [weedData, setWeedData] = useState(() => {
    const saved = localStorage.getItem("weedData");
    return saved ? JSON.parse(saved) : {};
  });
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("weedData", JSON.stringify(weedData));
  }, [weedData]);

  const daysThisMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const handleDayClick = (dateStr) => {
    const newCount = prompt("Enter number of weed for this day:", weedData[dateStr] || 0);
    if (newCount !== null) {
      const count = parseInt(newCount) || 0;
      setWeedData((prev) => ({
        ...prev,
        [dateStr]: count,
      }));
    }
  };

  // Surprise: Calculate streak for growth spark
  const calculateStreak = () => {
    const checkIns = {};
    Object.keys(weedData).forEach((date) => {
      checkIns[date] = weedData[date] === 0;
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
  const [showSpark, setShowSpark] = useState(false);

  useEffect(() => {
    if (streak >= 3) setShowSpark(true); // Growth spark at 3-day streak
  }, [streak]);

  return (
    <Layout>
      <motion.div
        className="p-6 max-w-3xl mx-auto rounded-xl mt-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className="text-3xl font-bold text-center mb-6 text-lime-700 animate-pulse">
          🌿 Track your daily usage🌿
        </h1>
        <motion.div
          className="bg-emerald-50 p-6 rounded-lg shadow-2xl"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex justify-between mb-4">
            <motion.button
              onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
              className="px-3 py-1 text-sm rounded-md font-medium bg-lime-500 text-white hover:bg-lime-600 transition-colors duration-200 transform hover:shadow-md"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              Previous
            </motion.button>
            <h2 className="text-xl font-semibold text-lime-700 drop-shadow-lg">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <motion.button
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
              className="px-3 py-1 text-sm rounded-md font-medium bg-lime-500 text-white hover:bg-lime-600 transition-colors duration-200 transform hover:shadow-md"
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
                className="text-center font-semibold text-sm text-lime-700 bg-emerald-100/50 rounded-full p-2 shadow-inner"
                whileHover={{ scale: 1.05, backgroundColor: "#A7F3D0" }}
              >
                {day}
              </motion.div>
            ))}
            {daysThisMonth.map((dateObj) => {
              const dateStr = format(dateObj, "yyyy-MM-dd");
              const isToday = isSameDay(dateObj, new Date());
              const weedCount = weedData[dateStr] || 0;
              const emoji = weedCount > 0 ? ` 🍃${weedCount}` : "✅";
              return (
                <motion.button
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={`rounded-lg h-12 flex items-center justify-center text-sm font-medium border 
                    ${isToday ? "bg-lime-200 border-lime-500" : weedCount > 0 ? "bg-yellow-400 border-transparent" : "bg-emerald-50 border-transparent"} 
                    text-lime-700 hover:bg-opacity-100 hover:shadow-xl transition-all duration-300`}
                  animate={isToday ? { scale: [1, 1.05, 1], opacity: [1, 0.9, 1], transition: { repeat: Infinity, duration: 2 } } : {}}
                  whileHover={{ scale: 1.1, boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)" }}
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
          className="mt-6 w-full px-4 py-2 text-sm rounded-md font-medium bg-lime-500 text-white hover:bg-lime-600 transition-colors duration-200 transform hover:shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Home
        </motion.button>

        {showSpark && (
          <motion.div
            className="mt-6 p-4 bg-lime-500/80 text-white rounded-lg text-center shadow-2xl border-2 border-lime-300"
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0, boxShadow: "0 0 20px #84CC16" }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
          >
            <h2 className="text-xl font-bold">🌟 Growth Spark!</h2>
            <p>3+ weed-free days! Your roots are deepening! 🌱</p>
            <motion.button
              onClick={() => setShowSpark(false)}
              className="mt-2 px-3 py-1 bg-white text-lime-500 rounded-md hover:bg-gray-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              Awesome!
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
};

export default WeedPage;