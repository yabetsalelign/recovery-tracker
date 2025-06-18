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
      <div className="p-6 max-w-3xl mx-auto rounded-xl mt-10">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-800">
          🚬 Sesh Tracker: Conquer Your Challenge! 🚬
        </h1>

        <div className="bg-gradient-to-br from-peach-500 to-orange-600 p-6 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out hover:scale-105">
          <div className="flex justify-between mb-4">
            <button
              onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
              className="px-3 py-1 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200"
            >
              Previous
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <button
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
              className="px-3 py-1 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200"
            >
              Next
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-8">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm text-gray-800"
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
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={`rounded-lg h-12 flex items-center justify-center text-sm font-medium border 
                    ${isToday ? "border-peach-300" : "border-transparent"} 
                    ${seshCount > 0 ? "bg-peach-200" : "bg-orange-100"} text-gray-800 hover:bg-opacity-80 transition-all duration-200`}
                >
                  {format(dateObj, "d")}
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => navigate("/home")}
          className="mt-6 w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200"
        >
          Back to Home
        </button>
      </div>
    </Layout>
  );
};

export default SeshPage;
