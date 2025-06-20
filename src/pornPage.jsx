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
import { motion } from "framer-motion"; // For animations

const PornPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pornData, setPornData] = useState(() => {
    const saved = localStorage.getItem("pornData");
    return saved ? JSON.parse(saved) : {};
  });
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem("pornData");
    return saved ? JSON.parse(saved).notes || "" : "";
  });
  const [streak, setStreak] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("pornData", JSON.stringify({ ...pornData, notes }));
    const checkIns = {};
    Object.keys(pornData).forEach((date) => {
      checkIns[date] = pornData[date] === 0;
    });
    let currentStreak = 0;
    const dates = Object.keys(checkIns)
      .sort((a, b) => new Date(b) - new Date(a));
    for (let date of dates) {
      if (checkIns[date] && isSameDay(new Date(date), new Date())) {
        currentStreak++;
      } else if (checkIns[date]) {
        break;
      }
    }
    setStreak(currentStreak);

    if (currentStreak >= 7) setShowReward(true); // Reward at 7-day streak
  }, [pornData, notes]);

  const handleDayClick = (dateStr) => {
    const newCount = prompt("Enter number of times for this day:", pornData[dateStr] || 0);
    if (newCount !== null) {
      const count = parseInt(newCount) || 0;
      setPornData((prev) => ({
        ...prev,
        [dateStr]: count,
      }));
    }
  };

  const daysThisMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto rounded-xl mt-10">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-800 animate-pulse">
          Porn Usage Tracker
        </h1>
        <motion.div
          className="bg-gradient-to-br from-peach-500 to-orange-600 via-red-400 p-6 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out hover:shadow-2xl"
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.03 }}
        >
          <div className="flex justify-between mb-4 items-center">
            <motion.button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="px-3 py-1 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200 transform hover:scale-105"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              Previous
            </motion.button>
            <h2 className="text-xl font-semibold text-white drop-shadow-md">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <motion.button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="px-3 py-1 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200 transform hover:scale-105"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              Next
            </motion.button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-6">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm text-gray-800 bg-peach-200 rounded-full p-2 shadow-sm"
              >
                {day}
              </div>
            ))}
            {daysThisMonth.map((dateObj) => {
              const dateStr = format(dateObj, "yyyy-MM-dd");
              const isToday = isSameDay(dateObj, new Date());
              const pornCount = pornData[dateStr] || 0;
              const emoji = pornCount > 0 ? ` 🔞 ${pornCount}` : " ✅";

              return (
                <motion.button
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={`rounded-lg h-12 flex items-center justify-center text-sm font-medium border 
                    ${isToday ? "border-2 border-peach-300" : "border-transparent"} 
                    ${pornCount > 0 ? "bg-orange-100 text-gray-800" : "bg-peach-100 text-gray-800"} 
                    hover:bg-orange-300 hover:text-white transition-all duration-300`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative">
                    {format(dateObj, "d")}
                    {isToday && (
                      <span className="absolute -top-2 -right-2 text-xs bg-yellow-400 rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        🎯
                      </span>
                    )}
                    {emoji}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="mb-6">
            <label className="block text-lg font-semibold text-white drop-shadow-md mb-2">
              Notes
            </label>
            <motion.textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-peach-400 transition-all duration-300 h-24 resize-none"
              whileFocus={{ scale: 1.02 }}
              placeholder="Add notes about your day..."
            />
          </div>
          <div className="mb-6">
            <p className="text-white font-semibold drop-shadow-md">
              Current Streak: {streak} days 🎉
            </p>
          </div>
          <motion.button
            onClick={() => navigate("/home")}
            className="w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200 transform hover:scale-105"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            Save & Return
          </motion.button>
          {showReward && (
            <motion.div
              className="mt-6 p-4 bg-green-500 text-white rounded-lg text-center"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <h2 className="text-xl font-bold">🎁 Streak Reward Unlocked!</h2>
              <p>Congrats on 7+ days! Treat yourself to a mental break 🌟</p>
              <motion.button
                onClick={() => setShowReward(false)}
                className="mt-2 px-3 py-1 bg-white text-green-500 rounded-md hover:bg-gray-100"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Close
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default PornPage;