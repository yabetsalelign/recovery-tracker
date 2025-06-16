import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";

const Notes = () => {
  const [trackers, setTrackers] = useState(() => {
    const saved = localStorage.getItem("trackers");
    const initialTrackers = saved ? JSON.parse(saved) : [];
    const addictions = JSON.parse(localStorage.getItem("addictions")) || [];
    return initialTrackers.length
      ? initialTrackers.filter((tracker) => addictions.includes(tracker.name))
      : addictions.map((name, index) => ({ id: index + 1, name, checkIns: {}, notes: {} }));
  });

  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const addictions = JSON.parse(localStorage.getItem("addictions")) || [];

  const daysThisMonth = eachDayOfInterval({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  useEffect(() => {
    const validTrackers = addictions.map((name, index) => {
      const existingTracker = trackers.find((t) => t.name === name);
      return existingTracker || { id: index + 1, name, checkIns: {}, notes: {} };
    });

    setTrackers(validTrackers);
    setLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("trackers", JSON.stringify(trackers));
  }, [trackers]);

  useEffect(() => {
    const initialExpanded = {};
    addictions.forEach((name) => {
      initialExpanded[name] = true;
    });
    setExpanded((prev) => ({ ...initialExpanded, ...prev }));
  }, []);

  const toggleSection = (name) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const updateNote = (addictionName, date, note) => {
    setTrackers((prev) =>
      prev.map((tracker) =>
        tracker.name === addictionName
          ? { ...tracker, notes: { ...tracker.notes, [date]: note || "" } }
          : tracker
      )
    );
  };

  if (loading) return <div className="text-center text-gray-800">Loading...</div>;

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto rounded-xl mt-10">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-800"> Your Notes </h1>
        <div className="bg-gradient-to-br from-peach-500 to-orange-600 p-6 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out hover:scale-105">
          {addictions.length === 0 ? (
            <p className="text-center text-gray-800">Add an addiction to start taking notes! 🌱</p>
          ) : (
            <>
              <div className="mb-4">
                <label htmlFor="dateSelect" className="text-gray-800 font-semibold mr-2">
                  Select Date:
                </label>
                <select
                  id="dateSelect"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="p-2 border border-peach-300 rounded-md text-sm text-gray-800 bg-white focus:ring"
                >
                  {daysThisMonth.map((dateObj) => (
                    <option key={format(dateObj, "yyyy-MM-dd")} value={format(dateObj, "yyyy-MM-dd")}>
                      {format(dateObj, "MMMM d, yyyy")}
                    </option>
                  ))}
                </select>
              </div>

              {addictions.map((addiction) => {
                const tracker = trackers.find((t) => t.name === addiction);
                const notes = tracker ? tracker.notes : {};
                const noteForDate = notes[selectedDate] || "";
                const isOpen = expanded[addiction];

                return (
                  <div key={addiction} className="mb-4 border border-peach-300 rounded-lg bg-peach-100 shadow-sm">
                    <button
                      onClick={() => toggleSection(addiction)}
                      className="w-full flex justify-between items-center px-4 py-2 bg-peach-200 text-gray-800 font-semibold rounded-t-lg hover:bg-peach-300 transition-colors duration-200"
                    >
                      <span>{addiction}</span>
                      <span className={`transform transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>
                        ▶
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-2">
                        {noteForDate && (
                          <div className="mb-2">
                            <p className="text-sm text-gray-800 mb-1 font-medium">
                              Note for {selectedDate}:
                            </p>
                            <p className="text-sm text-gray-800 mb-2">{noteForDate}</p>
                          </div>
                        )}
                        <textarea
                          id={`note-${addiction}-${selectedDate}`}
                          rows={3}
                          placeholder="Add a note for this day..."
                          value={noteForDate}
                          onChange={(e) => updateNote(addiction, selectedDate, e.target.value)}
                          className="w-full p-2 border border-peach-300 rounded-md text-sm focus:ring text-gray-800 bg-white"
                          aria-label={`Add note for ${addiction} on ${selectedDate}`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="mt-10 p-4 bg-white border border-peach-300 rounded-lg shadow-inner max-h-96 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">All Notes for {selectedDate}</h2>
          {addictions.every((addiction) => {
            const tracker = trackers.find((t) => t.name === addiction);
            const note = tracker?.notes?.[selectedDate] || "";
            return note.trim() === "";
          }) ? (
            <p className="text-gray-800 italic">No notes recorded for this date.</p>
          ) : (
            addictions.map((addiction) => {
              const tracker = trackers.find((t) => t.name === addiction);
              const note = tracker?.notes?.[selectedDate] || "";
              if (!note.trim()) return null;
              return (
                <div key={`${addiction}-summary`} className="mb-3 border-b border-peach-200 pb-2 last:mb-0">
                  <p className="font-semibold text-gray-800">{addiction}</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{note}</p>
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={() => navigate("/calendar")}
          className="mt-6 w-full px-4 py-2 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200"
          aria-label="Back to calendar"
        >
          Back to Calendar
        </button>
      </div>
    </Layout>
  );
};

export default Notes;