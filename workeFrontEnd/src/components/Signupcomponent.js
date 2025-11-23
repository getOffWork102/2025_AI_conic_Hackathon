import React, { Component } from "react";

class Signupcomponent extends Component {
  render() {
    return (
      <section className="signup" id="signup-section">
        <div className="signup" id="signup-div">
          <h2 className="signup" id="signup-title">
            회원가입
          </h2>
          <form
            className="signup"
            id="signup-form"
            onSubmit={function (e) {
              e.preventDefault();
              this.props.onSubmit(e.target[0].value, e.target[1].value);
              console.log(e.target.nickname.value);
            }.bind(this)}
          >
            <p className="signup">
              <label className="signup" htmlFor="nickname" id="nickname-field">
                별명
                <input
                  className="signup"
                  type="text"
                  id="nickname"
                  placeholder="홍길동"
                  value={this.props.nickname}
                ></input>
              </label>
            </p>
            <p className="signup">
              <label htmlFor="stress" id="stress-field">
                최대 긴장도
                <input
                  className="signup"
                  type="number"
                  id="stress"
                  min="1"
                  max="20"
                  step="1"
                  placeholder="1 - 20"
                  defaultValue={15}
                  value={this.props.stress}
                ></input>
              </label>
            </p>
            <input
              className="signup"
              type="submit"
              id="submit"
              value="회원가입 완료하기"
              // onClick={function () {}.bind(this)}
            ></input>
          </form>
        </div>
      </section>
    );
  }
}

export default Signupcomponent;
