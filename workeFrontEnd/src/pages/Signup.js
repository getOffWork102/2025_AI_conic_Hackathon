import React, { Component } from "react";
import axios from "axios";
import Signupcomponent from "../components/Signupcomponent";

import "./Signup.css";

class Signup extends Component {
  backendBaseUrl = "http://localhost:8080";
  constructor(props) {
    super(props);
    this.state = {
      nickname: "",
      stress: 0,
      email: "",
    };
  }
  // ★ 1. 화면이 켜지면 URL에서 이메일 뽑아오기
  componentDidMount() {
    const searchParams = new URLSearchParams(window.location.search);
    const emailFromUrl = searchParams.get("client_email");
    console.log("받아온 이메일:", emailFromUrl);
    if (emailFromUrl) {
      console.log("받아온 이메일:", emailFromUrl);
      this.setState({ email: emailFromUrl });
    } else {
      alert("잘못된 접근입니다.");
      window.location.href = "/"; // 이메일 없으면 쫓아내기
    }
  }
  handleSubmit(_nickname, _stress) {
    axios
      .post(
        `${this.backendBaseUrl}/client/signUp`,
        {
          client_name: _nickname,
          client_maxStress: _stress,
          client_email: this.state.email
        },
        {
          withCredentials: true, // ★ 3. 핵심: 이걸 켜야 쿠키(세션ID)를 트럭에 싣고 갑니다!
        }
      )
      .then((response) => {
        if (response.data === 200) {
          const backendUrl = "http://localhost:8080"; // 또는 process.env...
        window.location.href = `${backendUrl}/oauth2/authorization/google`;
        } else {
          alert("회원가입 실패: " + response.data);
        }
      })
      .catch((error) => {
        console.error("에러 발생:", error);
      });
  }
  render() {
    return (
      <div className="signup" id="signup-page">
        <Signupcomponent
          page={this.state.page}
          onSubmit={function (_nickname, _stress) {
            console.log("Signup.js onSubmit 호출됨:", _nickname, _stress);

            // 1. 상태 업데이트 (화면 갱신용)
            this.setState({ nickname: _nickname, stress: _stress });

            // 2. ★수정된 부분★
            // this.state 대신 인자로 받은 _nickname, _stress를 '직접' 전달합니다.
            this.handleSubmit(_nickname, _stress);
          }.bind(this)}
        ></Signupcomponent>
      </div>
    );
  }
}

export default Signup;
