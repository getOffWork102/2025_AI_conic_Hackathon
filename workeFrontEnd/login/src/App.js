import React, { Component } from "react";
import Upbar from "./components/Upbar";
import Content from "./components/Content";

import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nickname: "",
      stress: 0,
    };
  }
  handleSubmit = async (nickname, stress) => {
    try {
      const response = await fetch("/auth/google/signUp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname, stress }),
      });

      const result = await response.json();
      alert("서버 응답: " + result.message);
    } catch (error) {
      console.error("Error:", error);
      alert("서버 요청 중 오류가 발생했습니다.");
    }
  };
  render() {
    return (
      <div className="App">
        <Upbar></Upbar>
        <Content onSubmit={this.handleSubmit}></Content>
      </div>
    );
  }
}

export default App;
