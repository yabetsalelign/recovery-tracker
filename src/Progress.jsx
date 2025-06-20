import React, { useState, useEffect } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const Progress = () => {
  const [trackers, setTrackers] = useState(() => {
    const saved = localStorage.getItem("trackers");
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const daysThisMonth = eachDayOfInterval({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });
  const [addictions, setAddictions] = useState(() => {
    const saved = localStorage.getItem("addictions");
    return saved ? JSON.parse(saved) : [];
  });
  const [quote, setQuote] = useState("");

  const quotes = [
    "The best way out is always through. - Robert Frost",
    "You are stronger than you know. Keep going!",
    "Every small step is a victory. Celebrate yourself.",
    "Recovery is not a race, but a journey of courage.",
  ];

  useEffect(() => {
    const saved = localStorage.getItem("trackers");
    const loadedTrackers = saved ? JSON.parse(saved) : [];
    const validTrackers = loadedTrackers.length
      ? loadedTrackers.filter((tracker) => addictions.includes(tracker.name))
      : addictions.map((name, index) => ({ id: index + 1, name, checkIns: {}, notes: {} }));
    if (JSON.stringify(trackers) !== JSON.stringify(validTrackers)) {
      setTrackers(validTrackers);
      localStorage.setItem("trackers", JSON.stringify(validTrackers));
    }
    if (!quote) {
      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }
    setLoading(false);
  }, [addictions]);

  const exportData = () => {
    const csv = trackers
      .map((tracker) =>
        Object.entries(tracker.checkIns)
          .map(([date, checked]) => `${tracker.name},${date},${checked ? "Yes" : "No"}`)
          .join("\n")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recovery-tracker-data.csv";
    a.click();
  };

  const getChartData = () => {
    const labels = daysThisMonth.map((dateObj) => format(dateObj, "d"));
    const datasets = addictions.map((addiction) => {
      const tracker = trackers.find((t) => t.name === addiction);
      const checks = tracker?.checkIns || {};
      const data = daysThisMonth.map((dateObj) =>
        checks[format(dateObj, "yyyy-MM-dd")] ? 1 : 0
      );
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      return {
        label: addiction,
        data,
        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.6)`,
        borderColor: `rgba(${r}, ${g}, ${b}, 1)`,
        borderWidth: 1,
      };
    });
    return { labels, datasets };
  };

  const getPieChartData = () => {
    const totalDays = daysThisMonth.length;
    const datasets = addictions.map((addiction) => {
      const tracker = trackers.find((t) => t.name === addiction);
      const checks = tracker?.checkIns || {};
      const successCount = daysThisMonth.filter((dateObj) =>
        checks[format(dateObj, "yyyy-MM-dd")]
      ).length;
      const successPercentage = (successCount / totalDays) * 100 || 0;
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      return {
        data: [successPercentage, 100 - successPercentage],
        backgroundColor: [`rgba(${r}, ${g}, ${b}, 0.6)`, "rgba(220, 220, 220, 0.6)"],
        borderColor: [`rgba(${r}, ${g}, ${b}, 1)`, "rgba(220, 220, 220, 1)"],
        borderWidth: 1,
      };
    });
    return {
      labels: addictions.map((a) => `${a} Success`),
      datasets,
    };
  };

  if (loading) return <div className="text-center text-green-800">Loading...</div>;

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto rounded-xl mt-10">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-800">
          Recovery Progress
        </h1>
        <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out hover:scale-105">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-center mb-4 text-white">
              Daily Check-In Success (Bar Chart)
            </h2>
            <Bar
              data={getChartData()}
              options={{
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                      stepSize: 1,
                      callback: (value) => (value === 1 ? "Success" : "No Data"),
                    },
                  },
                },
                plugins: {
                  legend: { position: "top" },
                  title: { display: true, text: "Daily Check-In Success" },
                },
              }}
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-center mb-4 text-white">
              Success Percentage (Pie Chart)
            </h2>
            <Pie
              data={getPieChartData()}
              options={{
                plugins: {
                  legend: { position: "top" },
                  title: { display: true, text: "Success Percentage" },
                },
              }}
            />
          </div>
          {quote && <p className="mt-6 text-center text-white italic">{quote}</p>}
        </div>
        <button
          onClick={() => {
            console.log("Navigating to /streaks");
            navigate("/streaks");
          }}
          className="mt-6 w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200 transform transition-all duration-500 ease-in-out hover:scale-105"
          aria-label="View streaks"
        >
          View Streaks
        </button>
        <button
          onClick={exportData}
          className="mt-2 w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200 transform transition-all duration-500 ease-in-out hover:scale-105"
          aria-label="Export tracking data"
        >
          Export Data
        </button>
        <button
          onClick={() => {
            console.log("Navigating to /");
            navigate("/");
          }}
          className="mt-2 w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200 transform transition-all duration-500 ease-in-out hover:scale-105"
          aria-label="Back to welcome"
        >
          Back to Welcome
        </button>
      </div>
    </Layout>
  );
};

export default Progress;