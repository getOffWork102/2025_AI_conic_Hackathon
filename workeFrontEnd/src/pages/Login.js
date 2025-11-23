import React, { Component } from "react";
import Loginwin from "../components/Loginwin";
import "./Login.css";

class Login extends Component {
  backendBaseUrl =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
  constructor(props) {
    super(props);
    this.state = {
      nickname: "",
      stress: 0,
      page: "LOG IN",
    };

    this.handleGoogleLogin = this.handleGoogleLogin.bind(this);
  }

  handleGoogleLogin() {
    const backendBaseUrl =
      process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

    window.location.href = `${backendBaseUrl}/oauth2/authorization/google`;
  }

  render() {
    return (
      <div className="login-page">
        <Loginwin onLogin={this.handleGoogleLogin} />
      </div>
    );
  }
}

export default Login;
