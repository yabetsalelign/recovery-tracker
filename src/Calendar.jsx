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

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto rounded-xl mt-10">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-800"> Recovery Tracker: Stay on Track! </h1>
        <div className="bg-gradient-to-br from-peach-500 to-orange-600 p-6 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out hover:scale-105">
          <div className="flex justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="px-3 py-1 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200"
            >
              Previous
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="px-3 py-1 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200"
            >
              Next
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-8">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-gray-800">
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
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={`rounded-lg h-12 flex items-center justify-center text-sm font-medium border 
                    ${selectedDate === dateStr ? "bg-peach-500 text-gray-800" : "bg-peach-100 text-gray-800"} 
                    ${isToday ? "border-peach-300" : "border-transparent"} 
                    hover:bg-opacity-80 transition-all duration-200`}
                >
                  {format(dateObj, "d")}
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          {trackers.map((tracker, index) => (
            <p key={tracker.id} className="text-gray-800 text-sm">
              {tracker.name}: {streaks[index]} day streak!
            </p>
          ))}
        </div>

        <button
          onClick={() => navigate("/progress")}
          className="mt-6 w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200"
        >
          View Progress
        </button>
        <button
          onClick={() => navigate("/home")}
          className="mt-2 w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200"
        >
          Edit Addictions
        </button>
        <button
          onClick={() => navigate("/notes")}
          className="mt-2 w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200"
        >
          View Notes
        </button>

        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Addictions</h3>
          <ul className="list-disc pl-5 space-y-2">
            {addictions.map((addiction, index) => (
              <li
                key={index}
                className="flex justify-between items-center p-2 bg-white border border-peach-200 rounded-lg shadow-sm hover:bg-peach-50 transition-colors duration-200"
              >
                <span className="text-gray-800">{addiction}</span>
                <button
                  onClick={() => {
                    const newAddictions = addictions.filter((a) => a !== addiction);
                    localStorage.setItem("addictions", JSON.stringify(newAddictions));
                    setTrackers(trackers.filter((t) => t.name !== addiction));
                  }}
                  className="ml-4 px-2 py-1 text-sm rounded-md font-medium bg-red-500 text-gray-800 hover:bg-red-600"
                  aria-label={`Delete ${addiction}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default Calendar;
