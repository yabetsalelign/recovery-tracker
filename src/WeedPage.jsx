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

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto rounded-xl mt-10">
        <h1 className="text-3xl font-bold text-center mb-6 text-lime-700">
          🌿 Blunt Tracker: Ride the Rasta Road! 🌿
        </h1>

        <motion.div
          className="bg-gradient-to-br from-lime-500 via-yellow-400 to-red-500 p-6 rounded-lg shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="flex justify-between mb-4">
            <button
              onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
              className="px-3 py-1 text-sm rounded-md font-medium bg-lime-500 text-gray-900 hover:bg-lime-600 transition-colors duration-200"
            >
              Previous
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <button
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
              className="px-3 py-1 text-sm rounded-md font-medium bg-lime-500 text-gray-900 hover:bg-lime-600 transition-colors duration-200"
            >
              Next
            </button>
          </div>

          <motion.div
            className="grid grid-cols-7 gap-2 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm text-gray-900"
              >
                {day}
              </div>
            ))}
            {daysThisMonth.map((dateObj) => {
              const dateStr = format(dateObj, "yyyy-MM-dd");
              const isToday = isSameDay(dateObj, new Date());
              const weedCount = weedData[dateStr] || 0;
              const emoji = weedCount > 0 ? ` 🌿${weedCount}` : "✅";

              return (
                <motion.button
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={`rounded-lg h-12 flex items-center justify-center text-sm font-medium border 
                    ${isToday ? "bg-lime-200 border-lime-500 scale-110" : weedCount > 0 ? "bg-yellow-400 border-transparent" : "bg-emerald-50 border-transparent"} 
                    text-gray-900 hover:bg-opacity-80 transition-all duration-200`}
                  animate={isToday ? { scale: [1.1, 1.15, 1.1], transition: { repeat: Infinity, duration: 1.5 } } : {}}
                  whileHover={{ scale: 1.05, rotate: 2 }}
                >
                  {format(dateObj, "d")}
                  {emoji}
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>

        <button
          onClick={() => navigate("/home")}
          className="mt-6 w-full px-4 py-2 text-sm rounded-md font-medium bg-lime-500 text-gray-900 hover:bg-lime-600 transition-colors duration-200"
        >
          Back to Home
        </button>
      </div>
    </Layout>
  );
};

export default WeedPage;