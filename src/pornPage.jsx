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

const PornPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pornData, setPornData] = useState(() => {
    const saved = localStorage.getItem("pornData");
    return saved ? JSON.parse(saved) : {};
  });
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("pornData", JSON.stringify(pornData));
  }, [pornData]);

  const daysThisMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

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

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-4">Porn Tracker</h1>

        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between mb-2">
            <button
              onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
              className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
            >
              Previous
            </button>
            <h2 className="text-lg font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <button
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
              className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
            >
              Next
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-700"
              >
                {day}
              </div>
            ))}
            {daysThisMonth.map((dateObj) => {
              const dateStr = format(dateObj, "yyyy-MM-dd");
              const isToday = isSameDay(dateObj, new Date());
              const pornCount = pornData[dateStr] || 0;
              const emoji = pornCount > 0 ? ` ${pornCount}` : " ✅";

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={`w-10 h-10 flex items-center justify-center text-sm border 
                    ${isToday ? "border-gray-400" : "border-transparent"} 
                    ${pornCount > 0 ? "bg-gray-100" : "bg-white"} 
                    text-gray-900 hover:bg-gray-200 rounded`}
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
          className="mt-4 w-full px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300"
        >
          Back to Home
        </button>
      </div>
    </Layout>
  );
};

export default PornPage;