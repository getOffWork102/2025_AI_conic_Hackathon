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

  // [1] 충돌 여부 확인 후 -> 저장(HandleSubmit)으로 넘기는 함수
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
          // 상태 저장 후 POST 요청 실행
          this.HandleSubmit();
        });
      })
      .catch((error) => {
        console.error("Conflict Check Error:", error);
        // 에러 나도 일단 저장은 시도하거나, 여기서 중단할지 결정
        // 일단 진행하도록 설정
        this.HandleSubmit();
      });
  }

  // [2] 일정 저장 (POST)
  HandleSubmit() {
    // 기존 POST 로직 유지
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
        // ★ 중요: 백엔드에서 저장된 schedule_id를 반환해야 합니다!
        // 기존: response.data === 200
        // 변경필요: response.data가 schedule_id여야 함 (숫자)
        const savedScheduleId = response.data;

        if (this.state.err === 200) {
          // [Case A] 문제 없음 -> 홈으로
          alert("일정 추가 성공!");
          window.location.href = "/home";
        } else if (this.state.err === 406 || this.state.err === 408) {
          // [Case B] 충돌(406) or 스트레스(408) -> AI 추천 프로세스 시작
          this.handleAiRecommend(savedScheduleId, this.state.err);
        } else {
          // 그 외 에러
          alert(`일정이 저장되었으나 경고가 있습니다. (Code: ${this.state.err})`);
          window.location.href = "/home";
        }
      })
      .catch((error) => {
        console.error("에러 발생:", error);
        alert("일정 추가 실패");
        // window.location.href = "/home"; // 실패시엔 머무르는 게 좋을 수 있음
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
              this.checkConflictAndSubmit();
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