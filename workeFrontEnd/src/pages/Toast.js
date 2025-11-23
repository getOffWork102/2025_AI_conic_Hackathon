import React, { Component } from "react";
import Toastcomponent from "../components/Toastcomponents";

class Toast extends Component {
  constructor(props) {
    super(props);

    this.eventSource = null;

    this.state = {
      visible: false,
      toastData: "",
    };
  }

  componentDidMount() {
    this.connectSSE();
  }

  componentWillUnmount() {
    if (this.eventSource) this.eventSource.close();
  }

  connectSSE() {

    console.log("SSE 연결 시도중…");

    this.eventSource = new EventSource(
      "http://localhost:8080/api/notifications/subscribe",
      { withCredentials: true }
    );

    // 일반 message 이벤트
    this.eventSource.onmessage = (e) => {
      console.log("기본 메세지:", e.data);
      this.showToast(e.data);
    };

    // 서버에서 event: alarm 으로 보낼 때
    this.eventSource.addEventListener("alarm", (e) => {
      const message = e.data; // 서버에서 보낸 문자열
      console.log("알림 도착:", message);
      this.showToast(message);
    });

    // 에러 처리
    this.eventSource.onerror = (e) => {
      console.error("SSE Error:", e);
    };

    this.eventSource.onopen = () => {
      console.log("SSE 연결 성공");
    };
  }

  showToast(message) {
    this.setState({ visible: true, toastData: message });

    setTimeout(() => {
      this.setState({ visible: false });
    }, 3000);
  }

  render() {
    return (
      <Toastcomponent 
        visible={this.state.visible} 
        data={{ message: this.state.toastData }}
      />
    );
  }
}

export default Toast;
