import React, { Component } from "react";
import { Link } from "react-router-dom";

class Upbar extends Component {
  render() {
    return (
      <header>
        <h1>{this.props.page} </h1>
      </header>
    );
  }
}

export default Upbar;
