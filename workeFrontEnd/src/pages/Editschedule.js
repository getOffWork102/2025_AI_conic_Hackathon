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
      isLoaded: false,
    };
  }

  componentDidMount() {
    const params = new URLSearchParams(window.location.search);
    const schedule_id = params.get("id");
    const start_time = params.get("start");
    const end_time = params.get("end");

    this.setState({
      schedule_id: schedule_id,
      start_time: start_time,
      end_time: end_time,
    });

    axios
      .get(`${this.backendBaseUrl}/schedule/${schedule_id}`, {
        withCredentials: true,
      })
      .then((response) => {
        const data = response.data;
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
            isLoaded: true,
          });
        } else {
          console.warn("일정을 찾을 수 없습니다.");
          this.setState({ isLoaded: true });
        }
      })
      .catch((error) => {
        console.error("일정 불러오기 실패:", error);
        this.setState({ isLoaded: true });
      });
  }

  // [1] 일정 수정 (PATCH) -> 성공하면 충돌 체크로 이동
  HandleSubmit() {
    if (!this.state.schedule_id) {
      alert("일정 ID가 없습니다.");
      return;
    }

    console.log("1. 수정 요청 시작 (PATCH)");

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
        console.log("2. 수정 성공 -> 충돌 확인 시작");
        // 수정이 완료되었으니, 이제 이 ID로 충돌 여부를 확인합니다.
        this.checkConflictAndSubmit();
      })
      .catch((error) => {
        console.error("수정 에러:", error);
        alert("수정 실패: " + (error.response ? error.response.data : error.message));
      });
  }

  // [2] 충돌 여부 확인 (GET) -> 결과에 따라 분기 처리
  checkConflictAndSubmit() {
    const { schedule_id, start_time, end_time, stress_tag } = this.state;

    axios
      .get(`${this.backendBaseUrl}/schedule/conflict`, {
        params: {
          schedule_id: schedule_id, // 현재 수정된 스케줄 ID
          start_time: start_time,
          end_time: end_time,
          stress_tag: stress_tag,
        },
        withCredentials: true,
      })
      .then((response) => {
        const errCode = response.data.err;
        
        this.setState({ err: errCode }, () => {
            if (errCode === 200) {
              // [Case A] 문제 없음 -> 홈으로
              alert("일정 수정 성공!");
              window.location.href = "/home";
            } else if (errCode === 406 || errCode === 408) {
              // [Case B] 충돌(406) or 스트레스(408) -> AI 추천 프로세스 시작
              this.handleAiRecommend(schedule_id, errCode);
            } else {
              // 그 외 경고
              alert(`일정이 수정되었으나 경고가 있습니다. (Code: ${errCode})`);
              window.location.href = "/home";
            }
        });
      })
      .catch((error) => {
        console.error("Conflict Check Error:", error);
        alert("수정은 되었으나 충돌 확인 중 오류가 발생했습니다.");
        window.location.href = "/home";
      });
  }

  // [3] AI 추천 요청
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
        console.error("AI Error:", error);
        alert("AI 추천을 불러오는데 실패했습니다.");
        window.location.href = "/home";
      });
  }

  // [4] AI 추천 시간으로 재수정 (PATCH)
  applyAiRecommendation(scheduleId, newStart, newEnd) {
    axios
      .patch(
        `${this.backendBaseUrl}/schedule/${scheduleId}`,
        {
          start_time: newStart,
          end_time: newEnd,
          // 기존 state 값 유지
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
              // ★ 수정됨: checkConflict가 아니라 HandleSubmit(저장) 먼저 실행!
              this.HandleSubmit();
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