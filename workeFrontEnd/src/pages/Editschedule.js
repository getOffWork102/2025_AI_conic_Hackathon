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
      err: 200, // [추가] 에러 코드 상태 관리
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
      .get(`${this.backendBaseUrl}/schedule`, {
        params: { start_time, end_time },
        withCredentials: true,
      })
      .then((response) => {
        const list = response.data;
        const _event = list.find((e) => String(e.schedule_id) === String(schedule_id));

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
          });
        } else {
          console.warn("일정을 찾을 수 없습니다. (ID 불일치)");
        }
      })
      .catch((error) => {
        console.error("일정 불러오기 실패:", error);
      });
  }

  // [1] 충돌 여부 확인 후 -> 수정(HandleSubmit)으로 넘기는 함수
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
        // 에러 코드 저장 (200, 406, 408 등)
        const errCode = response.data.err;
        this.setState({ err: errCode }, () => {
          // 상태 저장 후 PATCH 요청 실행
          this.HandleSubmit();
        });
      })
      .catch((error) => {
        console.error("Conflict Check Error:", error);
        // 에러 나도 일단 수정은 시도
        this.HandleSubmit();
      });
  }

  // [2] 일정 수정 (PATCH)
  HandleSubmit() {
    if (!this.state.schedule_id) {
        alert("일정 ID가 없습니다.");
        return;
    }

    console.log("수정 요청 ID:", this.state.schedule_id);

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
        // 수정 성공 후, 저장해둔 에러 코드를 확인하여 분기 처리
        if (this.state.err === 200) {
          // [Case A] 문제 없음 -> 홈으로
          alert("일정 수정 성공!");
          window.location.href = "/home";
        } else if (this.state.err === 406 || this.state.err === 408) {
          // [Case B] 충돌(406) or 스트레스(408) -> AI 추천 프로세스 시작
          // 이미 수정된 상태이므로 schedule_id는 state에 있는 것 사용
          this.handleAiRecommend(this.state.schedule_id, this.state.err);
        } else {
          // 그 외 에러
          alert(`일정이 수정되었으나 경고가 있습니다. (Code: ${this.state.err})`);
          window.location.href = "/home";
        }
      })
      .catch((error) => {
        console.error("수정 에러:", error);
        alert("수정 실패: " + (error.response ? error.response.data : error.message));
        // window.location.href = "/home";
      });
  }

  // [3] AI 추천 요청 및 사용자 확인
  handleAiRecommend(scheduleId, errCode) {
    const msg = errCode === 406 ? "일정 겹침 감지!" : "스트레스 과부하 감지!";
    alert(`${msg} 이미 수정은 되었으나 문제가 있어, AI가 최적의 시간을 다시 계산합니다...`);

    axios
      .get(`${this.backendBaseUrl}/ai/rearrangement/${scheduleId}/${errCode}`, {
        withCredentials: true,
      })
      .then((response) => {
        const { start_time, end_time } = response.data;

        // 날짜 보기 좋게 변환
        const startStr = new Date(start_time).toLocaleString();
        const endStr = new Date(end_time).toLocaleString();

        // 사용자에게 제안
        const userChoice = window.confirm(
          `[AI 일정 추천]\n\n수정된 일정에 문제가 있어 AI가 새로운 시간을 제안했습니다.\n\n추천 시간: ${startStr} ~ ${endStr}\n\n이 시간으로 다시 변경하시겠습니까?`
        );

        if (userChoice) {
          // 수락 -> PATCH로 시간 재변경
          this.applyAiRecommendation(scheduleId, start_time, end_time);
        } else {
          // 거절 -> 홈으로 (이미 사용자가 입력한 대로 수정은 되어있음)
          alert("기존 수정 내역대로 유지됩니다.");
          window.location.href = "/home";
        }
      })
      .catch((error) => {
        console.error("AI 추천 실패:", error);
        alert("AI 추천을 불러오는데 실패했습니다. 수정된 내용이 유지됩니다.");
        window.location.href = "/home";
      });
  }

  // [4] AI 추천 시간으로 변경 (PATCH)
  applyAiRecommendation(scheduleId, newStart, newEnd) {
    axios
      .patch(
        `${this.backendBaseUrl}/schedule/${scheduleId}`,
        {
          // 변경할 시간
          start_time: newStart,
          end_time: newEnd,
          // 기존 정보 유지 (state에 있는 값 사용)
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
        console.error("재수정 실패:", error);
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
        
        // 삭제 버튼 클릭 시
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
              // ★ 변경됨: 바로 HandleSubmit이 아니라 Conflict 체크 먼저 실행!
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