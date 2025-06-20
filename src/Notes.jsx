import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import { motion, AnimatePresence } from "framer-motion";

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
    start: startOfMonth(subDays(new Date(), 30)), // Extend to 30 days back
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
      initialExpanded[name] = false; // Start collapsed for drama
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

  // Surprise: Calculate streak and trigger time capsule
  const calculateOverallStreak = () => {
    let maxStreak = 0;
    addictions.forEach((addiction) => {
      const tracker = trackers.find((t) => t.name === addiction);
      const checkIns = {};
      Object.keys(tracker?.notes || {}).forEach((date) => {
        checkIns[date] = !tracker.notes[date];
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
      maxStreak = Math.max(maxStreak, streak);
    });
    return maxStreak;
  };
  const overallStreak = calculateOverallStreak();
  const [showCapsule, setShowCapsule] = useState(false);
  const [capsuleMessage, setCapsuleMessage] = useState("");

  useEffect(() => {
    if (overallStreak >= 7) {
      setShowCapsule(true);
      const allNotes = trackers.flatMap((tracker) =>
        Object.entries(tracker.notes).filter(([_, note]) => note.trim())
      );
      if (allNotes.length) {
        const randomIndex = Math.floor(Math.random() * allNotes.length);
        setCapsuleMessage(`Time Capsule Memory: "${allNotes[randomIndex][1]}" from ${allNotes[randomIndex][0]}`);
      } else {
        setCapsuleMessage("Time Capsule: Keep writing to unlock memories!");
      }
    }
  }, [trackers]);

  if (loading) return <div className="text-center text-gray-800">Loading...</div>;

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto rounded-xl mt-10">
        <h1 className="text-4xl font-extrabold text-center mb-8 text-green-800 animate-pulse neon-text">
          Your Digital Journal
        </h1>
        <motion.div
          className="bg-gradient-to-br from-peach-500 to-orange-600 via-red-400 p-8 rounded-xl shadow-2xl transform transition-all duration-500 ease-in-out hover:shadow-neon"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {addictions.length === 0 ? (
            <motion.p
              className="text-center text-gray-200 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Ignite your journey—add an addiction to begin! 🔥
            </motion.p>
          ) : (
            <>
              <div className="mb-8 flex justify-center items-center space-x-4">
                <motion.label
                  htmlFor="dateSelect"
                  className="text-gray-200 font-semibold text-xl"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  Time Warp:
                </motion.label>
                <motion.select
                  id="dateSelect"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="p-3 border border-orange-300 rounded-lg text-lg text-gray-800 bg-white/80 focus:ring focus:ring-orange-400 hover:bg-orange-100 transition-all duration-300"
                  whileFocus={{ scale: 1.1, boxShadow: "0 0 10px #FDBA74" }}
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {daysThisMonth.map((dateObj) => (
                    <option
                      key={format(dateObj, "yyyy-MM-dd")}
                      value={format(dateObj, "yyyy-MM-dd")}
                      className="bg-peach-100 hover:bg-orange-200"
                    >
                      {format(dateObj, "MMM d, yyyy")}
                    </option>
                  ))}
                </motion.select>
              </div>

              <div className="space-y-6">
                {addictions.map((addiction) => {
                  const tracker = trackers.find((t) => t.name === addiction);
                  const notes = tracker ? tracker.notes : {};
                  const noteForDate = notes[selectedDate] || "";
                  const isOpen = expanded[addiction];

                  return (
                    <motion.div
                      key={addiction}
                      className="bg-white/70 border border-orange-300 rounded-xl p-4 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: addictions.indexOf(addiction) * 0.1 }}
                    >
                      <motion.button
                        onClick={() => toggleSection(addiction)}
                        className="w-full flex justify-between items-center px-4 py-3 bg-gradient-to-r from-peach-300 to-orange-400 text-gray-900 font-bold rounded-lg hover:from-peach-400 hover:to-orange-500 transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-lg">{addiction}</span>
                        <motion.span
                          className={`text-xl transform transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
                          animate={{ rotate: isOpen ? 90 : 0 }}
                        >
                          ➤
                        </motion.span>
                      </motion.button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 px-2"
                          >
                            {noteForDate && (
                              <div className="mb-3">
                                <p className="text-md text-gray-800 font-medium">
                                  Memory from {selectedDate}:
                                </p>
                                <p className="text-md text-gray-700 bg-gray-100 p-2 rounded mt-1">{noteForDate}</p>
                              </div>
                            )}
                            <motion.textarea
                              id={`note-${addiction}-${selectedDate}`}
                              rows={4}
                              placeholder="Scribe your thoughts..."
                              value={noteForDate}
                              onChange={(e) => updateNote(addiction, selectedDate, e.target.value)}
                              className="w-full p-3 border border-orange-300 rounded-lg text-md focus:ring focus:ring-orange-400 bg-white/90 text-gray-900 placeholder-gray-500 hover:border-orange-400 transition-all duration-300"
                              whileFocus={{ scale: 1.03, boxShadow: "0 0 8px #FDBA74" }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>

        <motion.div
          className="mt-10 p-5 bg-white/80 border border-orange-300 rounded-xl shadow-inner max-h-80 overflow-y-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-gray-800 drop-shadow-md">Timeline Echoes</h2>
          {addictions.every((addiction) => {
            const tracker = trackers.find((t) => t.name === addiction);
            const note = tracker?.notes?.[selectedDate] || "";
            return note.trim() === "";
          }) ? (
            <p className="text-gray-600 italic">No echoes yet—start writing!</p>
          ) : (
            addictions.map((addiction) => {
              const tracker = trackers.find((t) => t.name === addiction);
              const note = tracker?.notes?.[selectedDate] || "";
              if (!note.trim()) return null;
              return (
                <motion.div
                  key={`${addiction}-summary`}
                  className="mb-4 border-b border-orange-200 pb-3 last:mb-0"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="font-semibold text-gray-800">{addiction}</p>
                  <p className="text-gray-700 whitespace-pre-wrap bg-gray-100 p-2 rounded mt-1">{note}</p>
                </motion.div>
              );
            })
          )}
        </motion.div>

        <motion.button
          onClick={() => navigate("/calendar")}
          className="mt-6 w-full px-5 py-3 text-lg rounded-md font-semibold bg-gradient-to-r from-peach-300 to-orange-400 text-gray-900 hover:from-peach-400 hover:to-orange-500 transition-all duration-300 transform hover:scale-105"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Back to calendar"
        >
          Warp to Calendar
        </motion.button>

        {showCapsule && (
          <motion.div
            className="mt-6 p-5 bg-green-600/80 text-white rounded-xl text-center shadow-2xl border-2 border-green-400"
            initial={{ opacity: 0, scale: 0.7, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0, boxShadow: "0 0 25px #16A34A" }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
          >
            <h2 className="text-2xl font-bold">🌌 Time Capsule Unleashed!</h2>
            <p className="text-lg mt-2">{capsuleMessage}</p>
            <motion.div
              className="mt-3 flex justify-center space-x-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.svg
                className="w-6 h-6 text-yellow-400 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </motion.svg>
              <motion.button
                onClick={() => setShowCapsule(false)}
                className="px-4 py-2 bg-white text-green-600 rounded-md hover:bg-gray-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                Seal It
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Notes;