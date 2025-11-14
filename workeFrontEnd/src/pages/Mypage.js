import React, { Component } from "react";
import axios from "axios";
import Upbar from "../components/Upbar";
import Mypagewin from "../components/Mypagewin";

import "./Mypage.css";

class Mypage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nickname: "",
      stress: 0,
      email: "example@email.com",
      page: "MY PAGE",
    };
  }
  componentDidMount() {
    axios
      .get("/client/me")
      .then((response) => {
        const data = response.data;
        this.setState({
          nickname: data.name,
          email: data.email,
          stress: data.client_maxStress,
        });
      })
      .catch((error) => {
        console.error("유저 정보 불러오기 실패:", error);
      });
  }
  HandleSubmit() {
    const _nickname = this.state.nickname;
    const _stress = this.state.stress;
    axios
      .patch("/client/me/settings", {
        name: _nickname,
        client_maxStress: _stress,
      })
      .then((response) => {
        alert("회원정보 수정 성공: " + response.data);
      })
      .catch((error) => {
        console.error("에러 발생:", error);
      });
  }

  HandleDelete() {
    axios
      .post("/auth/google/delete")
      .then((response) => {
        alert("회원탈퇴 성공:" + response.data);
      })
      .catch((error) => {
        console.error("에러 발생:", error);
      });
  }

  HandleLogout() {
    axios
      .post("/auth/google/logout")
      .then((response) => {
        alert("로그아웃 성공:" + response.data);
      })
      .catch((error) => {
        console.error("에러 발생:", error);
      });
  }
  render() {
    return (
      <div className="Mypage">
        <Upbar page={this.state.page}></Upbar>
        <Mypagewin
          nickname={this.state.nickname}
          stress={this.state.stress}
          email={this.state.email}
          onSubmit={function (_nickname, _stress) {
            this.setState({
              nickname: _nickname,
              stress: _stress,
            });
          }.bind(this)}
          onDelete={() => this.HandleDelete()}
          onLogout={() => this.HandleLogout()}
        ></Mypagewin>
      </div>
    );
  }
}

export default Mypage;
