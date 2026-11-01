import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { UserProvider } from "./context/UserContext";
import { RecoveryProvider } from "./context/RecoveryContext";
import ThemeModal from "./components/ThemeModal";
import Welcome from "./Welcome";
import Home from "./Home";
import Calendar from "./Calendar";
import Day from "./Day";
import Notes from "./Notes";
import Progress from "./Progress";
import Streaks from "./Streaks";
import AddAddiction from "./AddAddiction";
import Counter from "./Counter";
import SeshPage from "./SeshPage";
import WeedPage from "./WeedPage";
import PornPage from "./pornPage";
import Settings from "./Settings";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <RecoveryProvider>
          <BrowserRouter>
            <ThemeModal />
            <Routes>
              <Route path="/porn" element={<PornPage />} />
              <Route path="/weed" element={<WeedPage />} />
              <Route path="/" element={<Welcome />} />
              <Route path="/home" element={<Home />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/day" element={<Day />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/streaks" element={<Streaks />} />
              <Route path="/add-addiction" element={<AddAddiction />} />
              <Route path="/counter" element={<Counter />} />
              <Route path="/sesh" element={<SeshPage />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </BrowserRouter>
        </RecoveryProvider>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
