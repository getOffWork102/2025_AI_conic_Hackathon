import React from "react";
import "../pages/Login.css"

function Loginwin({onLogin }) {
  return (
    <div className="login-content">
      <div className="login-card">
        <div className="login-inner">
          <h1 className="login-title">LOG IN</h1>

            <p className="login-text-main">'일단-쉼'에 오신 걸 환영해요!</p>

            <p className="login-text-sub">
             Google 계정으로 로그인하고
              <br />
             오늘 일정을 가볍게 정리해볼까요?
           </p>

            <button className="login-google-btn" onClick={onLogin}>
            <span className="login-google-icon">G</span>
            Google로 로그인
          </button>
        </div>
      </div>
    </div>
  );
}

export default Loginwin;
