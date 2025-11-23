import React, { Component } from "react";
import Toastcomponent from "../components/Toastcomponents";

class Toast extends Component {
  constructor(props) {
    super(props);

    this.eventSource = null;

    this.state = {
      visible: false,
      toastData: {
        type: "info",
        title: "",
        message: "",
        action: []    // {label, onClick}[]
      },
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

  // 문자열 or JSON → 표준 구조로 변환
  normalize(raw) {
    try {
      const parsed = JSON.parse(raw);

      return {
        type: parsed.type || "info",
        title: parsed.title || "알림",
        message: parsed.message || "",
        action: parsed.action || [],
      };
    } catch (err) {
      // 단순 문자열일 때
      return {
        type: "info",
        title: "알림",
        message: raw,
        action: [],
      };
    }
  }

  showToast(rawMessage) {
    const normalized = this.normalize(rawMessage);

    // 버튼이 자동으로 실행되도록 onClick 붙여주기
    const actionButtons = (normalized.action || []).map((btn) => ({
      label: btn.label,
      onClick: () => {
        console.log("버튼 클릭됨:", btn.label);
        if (btn.url) window.location.href = btn.url;
        if (btn.callback) btn.callback();
        this.setState({ visible: false });
      },
    }));

    this.setState({
      visible: true,
      toastData: {
        ...normalized,
        action: actionButtons,
      },
    });

    // 자동 닫기 (예/아니오 있을 때는 5초로)
    setTimeout(() => {
      this.setState({ visible: false });
    }, 5000);
  }

  render() {
    return (
      <Toastcomponent 
        visible={this.state.visible} 
        data={this.state.toastData}
      />
    );
  }
}

export default Toast;
