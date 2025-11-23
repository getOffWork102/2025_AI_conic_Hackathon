import React, { Component } from "react";
import axios from "axios";
import Schedulecomponent from "../components/Schedulecomponent";
import "./Schedule.css";

class Editschedule extends Component {
  backendBaseUrl = "http://localhost:8080";

  constructor(props) {
    super(props);
    this.state = {
      schedule_id: null,
      schedule_name: "",
      location: "",
      memo: "",
      start_time: "",
      end_time: "",
      final_end_date: "",
      stress_tag: 1,
      controllable: false,
      notification_time: 0,
      repeat_check: false,
      events: [],
      err: 200,
      isLoaded: false, // [필수] 로딩 상태 추가
    };
  }

  componentDidMount() {
    const params = new URLSearchParams(window.location.search);
    
    // [1] URL 파라미터 값을 변수에 저장 (setState보다 빠름)
    const schedule_id = params.get("id");
    const start_time = params.get("start");
    const end_time = params.get("end");

    // State 업데이트 (화면 표시용)
    this.setState({
      schedule_id: schedule_id,
      start_time: start_time,
      end_time: end_time,
    });

    // [2] ★ 중요 수정: this.state.schedule_id 대신 변수 schedule_id 사용
    // this.state.schedule_id는 아직 null일 수 있음!
    axios
      .get(`${this.backendBaseUrl}/schedule/${schedule_id}`, {
        withCredentials: true,
      })
      .then((response) => {
        // [3] 명세서가 배열([{}])로 온다고 했으므로 처리
        const data = response.data; 
        
        // 만약 배열이면 첫 번째 요소를 꺼내고, 객체면 그대로 사용
        const _event = Array.isArray(data) ? data[0] : data;

        if (_event) {
          this.setState({
            schedule_name: _event.schedule_name,
            location: _event.location,
            memo: _event.memo,
            final_end_date: _event.final_end_date,
            stress_tag: _event.stress_tag,
            controllable: _event.controllable,
            notification_time: _event.notification_time,
            repeat_check: _event.repeat_check,
            
            // 시작/종료 시간도 DB 값으로 덮어쓰기 (선택 사항, URL보다 정확할 수 있음)
            // start_time: _event.start_time,
            // end_time: _event.end_time,

            isLoaded: true, // [필수] 로딩 완료 신호
          });
        } else {
          console.warn("일정을 찾을 수 없습니다.");
          this.setState({ isLoaded: true }); // 실패해도 화면은 띄움
        }
      })
      .catch((error) => {
        console.error("일정 불러오기 실패:", error);
        this.setState({ isLoaded: true });
      });
  }

  // ... (checkConflictAndSubmit, HandleSubmit, handleAiRecommend 등 함수들은 그대로 유지) ...
  
  checkConflictAndSubmit() {
    axios
      .get(`${this.backendBaseUrl}/schedule/conflict`, {
        params: {
          start_time: this.state.start_time,
          end_time: this.state.end_time,
          stress_tag: this.state.stress_tag,
        },
        withCredentials: true,
      })
      .then((response) => {
        const errCode = response.data.err;
        this.setState({ err: errCode }, () => {
          this.HandleSubmit();
        });
      })
      .catch((error) => {
        this.HandleSubmit();
      });
  }

  HandleSubmit() {
    if (!this.state.schedule_id) {
      alert("일정 ID가 없습니다.");
      return;
    }

    axios
      .patch(
        `${this.backendBaseUrl}/schedule/${this.state.schedule_id}`,
        {
          schedule_name: this.state.schedule_name,
          location: this.state.location,
          memo: this.state.memo,
          start_time: this.state.start_time,
          end_time: this.state.end_time,
          final_end_date: this.state.final_end_date,
          stress_tag: this.state.stress_tag,
          controllable: this.state.controllable,
          notification_time: this.state.notification_time,
          repeat_check: this.state.repeat_check,
        },
        { withCredentials: true }
      )
      .then((response) => {
        if (this.state.err === 200) {
          alert("일정 수정 성공!");
          window.location.href = "/home";
        } else if (this.state.err === 406 || this.state.err === 408) {
          this.handleAiRecommend(this.state.schedule_id, this.state.err);
        } else {
          alert(`일정이 수정되었으나 경고가 있습니다. (Code: ${this.state.err})`);
          window.location.href = "/home";
        }
      })
      .catch((error) => {
        console.error("수정 에러:", error);
        alert("수정 실패");
      });
  }

  handleAiRecommend(scheduleId, errCode) {
    const msg = errCode === 406 ? "일정 겹침 감지!" : "스트레스 과부하 감지!";
    alert(`${msg} 이미 수정은 되었으나 문제가 있어, AI가 최적의 시간을 다시 계산합니다...`);

    axios
      .get(`${this.backendBaseUrl}/ai/rearrangement/${scheduleId}/${errCode}`, {
        withCredentials: true,
      })
      .then((response) => {
        const { start_time, end_time } = response.data;
        const startStr = new Date(start_time).toLocaleString();
        const endStr = new Date(end_time).toLocaleString();

        const userChoice = window.confirm(
          `[AI 일정 추천]\n\n추천 시간: ${startStr} ~ ${endStr}\n\n이 시간으로 다시 변경하시겠습니까?`
        );

        if (userChoice) {
          this.applyAiRecommendation(scheduleId, start_time, end_time);
        } else {
          alert("기존 수정 내역대로 유지됩니다.");
          window.location.href = "/home";
        }
      })
      .catch((error) => {
        alert("AI 추천을 불러오는데 실패했습니다.");
        window.location.href = "/home";
      });
  }

  applyAiRecommendation(scheduleId, newStart, newEnd) {
    axios
      .patch(
        `${this.backendBaseUrl}/schedule/${scheduleId}`,
        {
          start_time: newStart,
          end_time: newEnd,
          schedule_name: this.state.schedule_name,
          location: this.state.location,
          memo: this.state.memo,
          final_end_date: this.state.final_end_date,
          stress_tag: this.state.stress_tag,
          controllable: this.state.controllable,
          notification_time: this.state.notification_time,
          repeat_check: this.state.repeat_check,
        },
        { withCredentials: true }
      )
      .then(() => {
        alert("AI 추천 시간으로 변경되었습니다!");
        window.location.href = "/home";
      })
      .catch((error) => {
        alert("시간 변경에 실패했습니다.");
        window.location.href = "/home";
      });
  }

  HandleDelete() {
    if (!this.state.schedule_id) return;
    axios
      .delete(`${this.backendBaseUrl}/schedule`, {
        params: {
          end_time: this.state.end_time,
          schedule_id: this.state.schedule_id,
        },
        withCredentials: true,
      })
      .then((response) => {
        if (response.status === 200) {
          alert("일정 삭제 성공!");
          window.location.href = "/home";
        } else {
          alert("일정 삭제 실패");
        }
      })
      .catch((error) => {
        alert("삭제 실패");
        window.location.href = "/home";
      });
  }

  render() {
    // [4] 로딩 중이면 화면 그리지 않기 (빈 값 전달 방지)
    if (!this.state.isLoaded) {
        return <div>Loading...</div>;
    }

    return (
      <Schedulecomponent
        key={this.state.schedule_id}
        schedule_name={this.state.schedule_name}
        location={this.state.location}
        memo={this.state.memo}
        start_time={this.state.start_time}
        end_time={this.state.end_time}
        final_end_date={this.state.final_end_date}
        stress_tag={this.state.stress_tag}
        controllable={this.state.controllable}
        repeat_check={this.state.repeat_check}
        notification_time={this.state.notification_time}
        
        HandleDelete={() => this.HandleDelete()} 
        
        onSubmit={function (
          schedule_name,
          location,
          stress_tag,
          start_time,
          end_time,
          final_end_date,
          controllable,
          repeat_check,
          notification_time,
          memo
        ) {
          this.setState({
            schedule_name: schedule_name,
            location: location,
            memo: memo,
            start_time: start_time,
            end_time: end_time,
            final_end_date: final_end_date,
            stress_tag: Number(stress_tag),
            controllable: controllable,
            notification_time: Number(notification_time),
            repeat_check: repeat_check,
          }, () => {
              this.checkConflictAndSubmit();
          });
        }.bind(this)}
        
        onClick={() => {
            this.HandleDelete(); 
        }}
        
        title="일정 수정"
        btn1="수정"
        btn2="삭제"
      ></Schedulecomponent>
    );
  }
}

export default Editschedule;