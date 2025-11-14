import React, { Component } from "react";
import { Link } from "react-router-dom";
import logo from "../logo.png";
import mypage from "../mypage.png";
class Upbar extends Component {
  render() {
    return (
      <header>
        <img src={logo} alt="logo" className="logo"></img>
        <Link to="/mypage">
          <img src={mypage} alt="mypage" className="mypage"></img>
        </Link>
        <h1>{this.props.page} </h1>
      </header>
    );
  }
}

export default Upbar;
