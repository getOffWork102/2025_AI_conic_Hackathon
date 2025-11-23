import React, { Component } from "react";

class Mypagecomponent extends Component {
  render() {
    return (
      <section className="mypage" id="mypage-section">
        <div className="mypage" id="mypage-div">
          <h2 className="mypage" id="mypage-title">
            내 정보
          </h2>
          <form
            className="mypage"
            id="mypage-form"
            onSubmit={function (e) {
              e.preventDefault();
              this.props.onSubmit(
                e.target.nickname.value,
                e.target.stress.value
              );
              alert("APPLY Successful!");
            }.bind(this)}
          >
            <p className="mypage">
              <label className="mypage" id="nickname-field" htmlFor="nickname">
                별명
                <input
                  className="mypage"
                  type="text"
                  id="nickname"
                  defaultValue={this.props.nickname}
                ></input>
              </label>
            </p>
            <p className="mypage">
              <label className="mypage" htmlFor="stress" id="stress-field">
                최대 스트레스
                <input
                  className="mypage"
                  type="number"
                  id="stress"
                  defaultValue={this.props.stress}
                  min="1"
                  max="20"
                  step="1"
                ></input>
              </label>
            </p>
            <p className="mypage">
              <label className="mypage" htmlFor="email" id="email-field">
                이메일
                <input
                  className="mypage"
                  type="text"
                  id="email"
                  value={this.props.email}
                  readOnly
                ></input>
              </label>
            </p>
            <input
              className="mypage"
              type="submit"
              id="apply"
              value="수정하기"
              // onClick={function () {}.bind(this)}
            ></input>
          </form>
          <div className="mypage" id="buttons">
            <input
              type="submit"
              id="logout"
              value="로그아웃"
              className="mypage"
              onClick={function (e) {
                e.preventDefault();
                this.props.onLogout();
                alert("Logged Out!");
              }.bind(this)}
            ></input>
            <input
              type="submit"
              id="delete"
              value="회원탈퇴하기"
              className="mypage"
              onClick={function (e) {
                e.preventDefault();
                this.props.onDelete();
                alert("Account Deleted!");
              }.bind(this)}
            ></input>
          </div>
        </div>
      </section>
    );
  }
}

export default Mypagecomponent;
