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

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto rounded-xl mt-10" style={{ backgroundColor: '#2A403F' }}>
        <h1 className="text-3xl font-bold text-center mb-6 text-orange-500">
          🚬 Sesh Tracker: Reflect & Rise 🚬
        </h1>

        <motion.div
          className="bg-gray-900/80 p-6 rounded-lg shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="flex justify-between mb-4">
            <button
              onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
              className="px-3 py-1 text-sm rounded-md font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors duration-200"
            >
              Previous
            </button>
            <h2 className="text-xl font-semibold text-white">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <button
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
              className="px-3 py-1 text-sm rounded-md font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors duration-200"
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
                className="text-center font-semibold text-sm text-white"
              >
                {day}
              </div>
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
                    text-white hover:shadow-lg hover:bg-opacity-90 transition-all duration-200`}
                  animate={isToday ? { scale: [1, 1.05, 1], opacity: [1, 0.9, 1], transition: { repeat: Infinity, duration: 2 } } : {}}
                  whileHover={{ scale: 1.02, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
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
          className="mt-6 w-full px-4 py-2 text-sm rounded-md font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors duration-200"
        >
          Back to Home
        </button>
      </div>
    </Layout>
  );
};

export default SeshPage;