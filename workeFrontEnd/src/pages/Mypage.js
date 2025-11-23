import React, { Component } from "react";
import axios from "axios";
// import Upbar from "../components/Upbar";
import Mypagewin from "../components/Mypagecomponent";

import "./Mypage.css";

class Mypage extends Component {
  backendBaseUrl = "http://localhost:8080";
  constructor(props) {
    super(props);
    this.state = {
      nickname: "",
      stress: "",
      email: "someone@example.com",
      page: "MY PAGE",
    };
  }
  componentDidMount() {
    console.log("Mypage componentDidMount");

    // 백엔드 주소 명시 (Proxy 설정이 되어 있다면 생략 가능)

    axios
      .get(`${this.backendBaseUrl}/client/me`, {
        // 1. 주소 확실하게
        withCredentials: true, // ★ 2. 핵심: 이게 있어야 세션이 날아갑니다!
      })
      .then((response) => {
        const data = response.data;
        this.setState({
          // 백엔드에서 보내주는 변수명과 일치해야 함 (아래 백엔드 코드 참고)
          nickname: data.client_name,
          email: data.client_email,
          stress: data.client_maxStress,
        });
      })
      .catch((error) => {
        console.error("유저 정보 불러오기 실패:", error);
        if (error.response && error.response.status === 401) {
          alert("로그인이 필요합니다.");
          window.location.href = "/"; // 원하는 경로로 바꿔도 됨
        }
      });
  }
  HandleSubmit() {
    const _nickname = this.state.nickname;
    const _stress = this.state.stress;
    axios
      .patch(
        `${this.backendBaseUrl}/client/me/settings`,
        {
          client_name: _nickname,
          client_maxStress: _stress,
        },
        {
          withCredentials: true, // ★ 3. 핵심: 이걸 켜야 쿠키(세션ID)를 트럭에 싣고 갑니다!
        }
      )
      .then((response) => {
        alert("회원정보 수정 성공: " + response.data);
        window.location.href = "/home";
      })
      .catch((error) => {
        console.error("에러 발생:", error);
      });
  }

  HandleDelete() {
    axios
      .delete(`${this.backendBaseUrl}/client/delete`, {
        withCredentials: true, // ★ 3. 핵심: 이걸 켜야 쿠키(세션ID)를 트럭에 싣고 갑니다!
        data: {},
      })
      .then((response) => {
        alert("회원탈퇴 성공:" + response.data);
        window.location.href = "/";
      })
      .catch((error) => {
        console.error("에러 발생:", error);
      });
  }

  HandleLogout() {
    axios.post(
      `${this.backendBaseUrl}/auth/google/logout`,
      {},
      { withCredentials: true }  // ← 이게 config로 들어가야 함
    )
    .then((response) => {
      alert("로그아웃 성공");
      window.location.href = "/";
    })
    .catch((error) => {
      console.error("에러 발생:", error);
    });
  }
  
  render() {
    return (
      <div className="mypage">
        <Mypagewin
          nickname={this.state.nickname}
          stress={this.state.stress}
          email={this.state.email}
          onSubmit={function (_nickname, _stress) {
            this.setState(
              {
                nickname: _nickname,
                stress: _stress,
              },
              () => {
                // 이 안쪽은 setState가 확실히 끝난 뒤에 실행됩니다.
                this.HandleSubmit();
              }
            );
          }.bind(this)}
          onDelete={() => this.HandleDelete()}
          onLogout={() => this.HandleLogout()}
        ></Mypagewin>
      </div>
    );
  }
}

export default Mypage;