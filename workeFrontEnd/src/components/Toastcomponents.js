import React, { Component } from "react";
import "../pages/Toast.css";

class Toastcomponent extends Component {
  render() {
    const { visible, data } = this.props;

    if (!visible || !data) return null;

    return (
      <section className={`toast-wrapper ${visible ? "show" : ""}`}>
        <div className={`toast-card ${data.type}`}>
          <div className="toast-title">{data.title}</div>
          <div className="toast-message">{data.message}</div>
        </div>
      </section>
    );
  }
}

export default Toastcomponent;
