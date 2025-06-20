import React, { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import { motion } from "framer-motion"; // Import framer-motion for animations

const Calendar = () => {
  const [trackers, setTrackers] = useState(() => {
    const saved = localStorage.getItem("trackers");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const saved = localStorage.getItem("selectedDate");
    return saved || format(new Date(), "yyyy-MM-dd");
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const navigate = useNavigate();

  const addictions = JSON.parse(localStorage.getItem("addictions") || "[]");

  useEffect(() => {
    localStorage.setItem("trackers", JSON.stringify(trackers));
    localStorage.setItem("selectedDate", selectedDate);
  }, [trackers, selectedDate]);

  useEffect(() => {
    if (!trackers.length && addictions.length) {
      setTrackers(
        addictions.map((name, index) => ({
          id: index + 1,
          name,
          checkIns: {},
          notes: {},
        }))
      );
    }
  }, [addictions, trackers.length]);

  const calculateStreak = (checkIns) => {
    let streak = 0;
    const dates = Object.keys(checkIns).sort((a, b) => new Date(b) - new Date(a));
    for (let date of dates) {
      if (checkIns[date]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const streaks = trackers.map((tracker) => calculateStreak(tracker.checkIns));

  const daysThisMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const handleDayClick = (dateStr) => {
    setSelectedDate(dateStr);
    navigate(`/day?date=${dateStr}`);
  };

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto rounded-xl mt-10">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-800 animate-pulse">
          Recovery Tracker: Stay on Track!
        </h1>
        <motion.div
          className="bg-gradient-to-br from-teal-500 to-emerald-600 p-6 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out hover:shadow-2xl"
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex justify-between mb-4 items-center">
            <motion.button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="px-4 py-2 text-sm rounded-md font-medium bg-teal-300 text-gray-800 hover:bg-teal-400 transition-colors duration-200 transform hover:scale-105"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              Previous
            </motion.button>
            <h2 className="text-2xl font-bold text-white drop-shadow-md">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <motion.button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="px-4 py-2 text-sm rounded-md font-medium bg-teal-300 text-gray-800 hover:bg-teal-400 transition-colors duration-200 transform hover:scale-105"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              Next
            </motion.button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-8">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm text-white bg-teal-700 rounded-full p-2 shadow-sm"
              >
                {day}
              </div>
            ))}

            {daysThisMonth.map((dateObj) => {
              const dateStr = format(dateObj, "yyyy-MM-dd");
              const isToday = isSameDay(dateObj, new Date());
              const seshCount = trackers.filter((t) => t.checkIns[dateStr]).length;
              let emoji = "";
              if (seshCount > 0 && seshCount < trackers.length) {
                emoji = ` ⚪ ${seshCount}`;
              } else if (seshCount === trackers.length) {
                emoji = ` ✅`;
              }

              return (
                <motion.button
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={`rounded-full h-12 flex items-center justify-center text-sm font-medium border 
                    ${selectedDate === dateStr ? "bg-emerald-500 text-white" : "bg-teal-100 text-gray-800"} 
                    ${isToday ? "border-4 border-gradient-to-br from-green-400 to-teal-500" : "border-transparent"} 
                    hover:bg-emerald-300 hover:text-white transition-all duration-300`}
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
        </motion.div>

        <motion.button
          onClick={() => navigate("/progress")}
          className="mt-6 w-full px-4 py-2 text-sm rounded-md font-medium bg-teal-300 text-gray-800 hover:bg-teal-400 transition-colors duration-200 transform hover:scale-105"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          View Progress
        </motion.button>
        <motion.button
          onClick={() => navigate("/home")}
          className="mt-2 w-full px-4 py-2 text-sm rounded-md font-medium bg-teal-300 text-gray-800 hover:bg-teal-400 transition-colors duration-200 transform hover:scale-105"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Edit Addictions
        </motion.button>
        <motion.button
          onClick={() => navigate("/notes")}
          className="mt-2 w-full px-4 py-2 text-sm rounded-md font-medium bg-teal-300 text-gray-800 hover:bg-teal-400 transition-colors duration-200 transform hover:scale-105"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          View Notes
        </motion.button>

        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Addictions</h3>
          <ul className="list-disc pl-5 space-y-2">
            {addictions.map((addiction, index) => (
              <motion.li
                key={index}
                className="flex justify-between items-center p-2 bg-white border border-teal-200 rounded-lg shadow-sm hover:bg-teal-50 transition-colors duration-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-gray-800">{addiction}</span>
                <motion.button
                  onClick={() => {
                    const newAddictions = addictions.filter((a) => a !== addiction);
                    localStorage.setItem("addictions", JSON.stringify(newAddictions));
                    setTrackers(trackers.filter((t) => t.name !== addiction));
                  }}
                  className="ml-4 px-2 py-1 text-sm rounded-md font-medium bg-red-500 text-gray-800 hover:bg-red-600 transition-colors duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`Delete ${addiction}`}
                >
                  Delete
                </motion.button>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default Calendar;