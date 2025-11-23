import React, { Component } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Mypage from "./pages/Mypage";
import Calendar from "./pages/Calendar";
import Addschedule from "./pages/Addschedule";
import Editschedule from "./pages/Editschedule";
import Toast from "./pages/Toast";

class App extends Component {
  render() {
    return (
    <>  
      <Toast />
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/mypage" element={<Mypage  />} />
            <Route path="/home" element={<Calendar />} />
            <Route path="/addschedule" element={<Addschedule />} />
            <Route path="/editschedule" element={<Editschedule />} />
          </Routes>
        </Router>
      </>
    );
  }
}

export default App;
