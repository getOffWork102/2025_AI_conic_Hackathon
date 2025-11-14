import React, { Component } from "react";
import axios from "axios";
import Upbar from "../components/Upbar";
import Signupwin from "../components/Signupwin";

import "./Signup.css";

class Signup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nickname: "",
      stress: 0,
      page: "SIGN UP",
    };
  }
  handleSubmit() {
    const _nickname = this.state.nickname;
    const _stress = this.state.stress;

    axios
      .post("/auth/google/signUp", {
        name: _nickname,
        client_maxStress: _stress,
      })
      .then((response) => {
        alert("회원가입 성공: " + response.data);
      })
      .catch((error) => {
        console.error("에러 발생:", error);
      });
  }
  render() {
    return (
      <div className="Signup">
        <Upbar page={this.state.page}></Upbar>
        <Signupwin
          onSubmit={function (_nickname, _stress) {
            this.setState({ nickname: _nickname, stress: _stress }, () => {
              this.handleSubmit();
            });
          }.bind(this)}
        ></Signupwin>
      </div>
    );
  }
}

export default Signup;
