import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Mypage from "./pages/Mypage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/mypage" element={<Mypage />} />
      </Routes>
    </Router>
  );
}

export default App;
