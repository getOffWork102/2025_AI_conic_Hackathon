import React, { Component } from "react";
import axios from "axios";
import Schedulecomponent from "../components/Schedulecomponent";

import "./Schedule.css";

class Addschedule extends Component {
  backendBaseUrl = "http://localhost:8080";

  constructor(props) {
    super(props);
    const currentDate = new Date();
    this.state = {
      schedule_name: "Event",
      location: "",
      memo: "",
      // 날짜 포맷팅
      start_time: `${currentDate.getFullYear()}-${
        currentDate.getMonth() + 1
      }-${currentDate.getDate()}T${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`,
      end_time: `${currentDate.getFullYear()}-${
        currentDate.getMonth() + 1
      }-${currentDate.getDate()}T${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`,
      final_end_date: `${currentDate.getFullYear()}-${
        currentDate.getMonth() + 1
      }-${currentDate.getDate()}T${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`,
      stress_tag: 1,
      controllable: false,
      notification_time: null,
      repeat_check: false,
      err: 200, // 에러 코드 저장용 state
    };
  }
// [1] 일정 저장 (POST)
  HandleSubmit() {
    axios
      .post(
        `${this.backendBaseUrl}/schedule`,
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
        // 백엔드에서 schedule_id(Long)를 바로 반환한다고 가정 (예: 275)
        // 만약 객체로 온다면 response.data.id 등으로 맞춰야 함
        const savedScheduleId = response.data; 

        console.log("저장된 ID:", savedScheduleId); // 로그 확인

        // 저장은 성공했으니, 이제 충돌 체크를 하러 감
        this.checkConflictAndSubmit(savedScheduleId);
      })
      .catch((error) => {
        console.error("저장 실패:", error);
        alert("일정 추가 실패");
      });
  }

  // [2] 충돌 여부 확인 (GET)
  checkConflictAndSubmit(schedule_id) {
    // schedule_id가 제대로 넘어왔는지 확인
    if (!schedule_id) {
        console.error("ID 없이 충돌 체크를 시도했습니다.");
        return;
    }

    axios
      .get(`${this.backendBaseUrl}/schedule/conflict`, {
        params: {
          // ★ [수정] this.schedule_id -> schedule_id (매개변수 사용)
          schedule_id: schedule_id, 
          start_time: this.state.start_time,
          end_time: this.state.end_time,
          stress_tag: this.state.stress_tag,
        },
        withCredentials: true,
      })
      .then((response) => {
        const errCode = response.data.err;
        
        // 상태 업데이트
        this.setState({ err: errCode }, () => {
            if (errCode === 200) {
              // [Case A] 문제 없음 -> 홈으로
              alert("일정 추가 성공!");
              window.location.href = "/home";
            } else if (errCode === 406 || errCode === 408) {
              // [Case B] 충돌(406) or 스트레스(408) -> AI 추천
              this.handleAiRecommend(schedule_id, errCode);
            } else {
              // 그 외 경고
              alert(`일정이 저장되었으나 경고가 있습니다. (Code: ${errCode})`);
              window.location.href = "/home";
            }
        });
      })
      .catch((error) => {
        console.error("Conflict Check Error:", error);
        
        // ★ 충돌 체크 API 자체가 실패했을 때 (서버 에러, 파라미터 에러 등)
        // 롤백(삭제)을 할지 말지는 선택사항입니다.
        // 일단은 롤백 로직을 유지하되, 로그를 보고 원인을 알 수 있게 함
        alert("충돌 확인 중 오류가 발생하여 일정이 취소되었습니다.");
        this.HandleDelete(schedule_id);
      });
  }

  HandleDelete(schedule_id) {
    if (!schedule_id) return;
    axios
      .delete(`${this.backendBaseUrl}/schedule`, {
        params: {
          end_time: this.state.end_time,
          schedule_id: schedule_id,
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

  

  // [3] AI 추천 요청 및 사용자 확인
  handleAiRecommend(scheduleId, errCode) {
    const msg = errCode === 406 ? "일정 겹침 감지!" : "스트레스 과부하 감지!";
    alert(`${msg} AI가 최적의 시간을 계산 중입니다... 잠시만 기다려주세요.`);

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
          `[AI 일정 추천]\n\n기존 일정에 문제가 있어 AI가 새로운 시간을 제안했습니다.\n\n추천 시간: ${startStr} ~ ${endStr}\n\n이 시간으로 변경하시겠습니까?`
        );

        if (userChoice) {
          // 수락 -> PATCH로 시간 변경
          this.applyAiRecommendation(scheduleId, start_time, end_time);
        } else {
          // 거절 -> 그냥 홈으로 (이미 저장은 되어있음)
          alert("기존 시간대로 저장되었습니다.");
          window.location.href = "/home";
        }
      })
      .catch((error) => {
        console.error("AI 추천 실패:", error);
        alert("AI 추천을 불러오는데 실패했습니다. 기존 시간대로 저장됩니다.");
        window.location.href = "/home";
      });
  }

  // [4] AI 추천 시간으로 변경 (PATCH)
  applyAiRecommendation(scheduleId, newStart, newEnd) {
    axios
      .patch(
        `${this.backendBaseUrl}/schedule/${scheduleId}`,
        {
          // 변경할 시간만 보내고 나머지는 기존 state 사용
          start_time: newStart,
          end_time: newEnd,
          // 기존 정보 유지
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
        console.error("수정 실패:", error);
        alert("시간 변경에 실패했습니다.");
        window.location.href = "/home";
      });
  }

  render() {
    return (
      <Schedulecomponent
        schedule_name={this.state.schedule_name}
        location={this.state.location}
        stress_tag={this.state.stress_tag}
        start_time={this.state.start_time}
        end_time={this.state.end_time}
        final_end_date={this.state.final_end_date}
        controllable={this.state.controllable}
        repeat_check={this.state.repeat_check}
        notification_time={this.state.notification_time}
        memo={this.state.memo}
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
          this.setState(
            {
              schedule_name: schedule_name,
              location: location,
              memo: memo,
              start_time: start_time,
              end_time: end_time,
              final_end_date: final_end_date,
              stress_tag: Number(stress_tag),
              controllable: controllable,
              notification_time: Number(notification_time),
              repeat_check: Boolean(repeat_check),
            },
            () => {
              // ★ 중요: 바로 HandleSubmit이 아니라 Conflict 체크 먼저 실행!
              this.HandleSubmit();
            }
          );
        }.bind(this)}
        onClick={() => {
          window.location.href = "/home";
        }}
        title="일정추가"
        btn1="적용하기"
        btn2="취소하기"
      ></Schedulecomponent>
    );
  }
}

export default Addschedule;