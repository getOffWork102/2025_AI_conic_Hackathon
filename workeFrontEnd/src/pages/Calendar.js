import React, { Component } from "react";
import Calendarcomponent from "../components/Calendarcomponent";
import axios from "axios";
import "./Calendar.css";

class Calendar extends Component {
  backendBaseUrl = "http://localhost:8080";
  constructor(props) {
    super(props);
    const now = new Date(); // 오늘
    const year = now.getFullYear();
    const month = now.getMonth(); // 0~11

    // 월의 시작
    const startOfMonth = new Date(year, month, 1);
    // 다음 달의 0일 = 이번달 마지막 날
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    this.state = {
      start: startOfMonth.toISOString().replace(".000Z", ""),
      end: endOfMonth.toISOString().replace(".000Z", ""),
      events: [],
      stressByDate: {},   // "YYYY-MM-DD" -> number
      maxStress: 0,    // clinet에서 계산된 최대 스트레스 값
      stressSum: 0,
      stressAvg: 0,
      stressUtil: 0,
      currentView: "dayGridMonth", // 초기: 월
      daysInRange: 0,             // 기간 일수
    };
  }


  fetchStressSummary(startIso, endIso) {
    
    axios
      .get(`${this.backendBaseUrl}/client/me`, { withCredentials: true })
      .then(meRes => {
        const max = meRes.data.client_maxStress;

        return axios.get(`${this.backendBaseUrl}/stress/summary`, {
          params: { start_time: startIso, end_time: endIso },
          withCredentials: true,
        }).then(sumRes => {
          const map = {};
          let accumulation = 0;
          sumRes.data.forEach(item => {
            const key = item.date.slice(0, 10);
            const v = item.total_stress ?? 0;
            map[key] = v; 
            accumulation += v;
          });

          // 기간 일수(포함 범위)
          const daysInRange = Math.max(
            1,
            Math.round((Date.parse(endIso) - Date.parse(startIso)) / (1000*60*60*24)) // end는 exclusive
          );
          const avg = accumulation / daysInRange;
          const periodMax = (max ?? 0) * daysInRange;
          const util = periodMax > 0 ? (accumulation / periodMax) * 100 : null;

          this.setState({
            stressByDate: map,
            maxStress: max,
            daysInRange: daysInRange,
            stressSum: accumulation,
            stressAvg: Number.isFinite(avg) ? Number(avg.toFixed(2)) : 0,
            stressUtil: util != null ? Number(util.toFixed(1)) : null, // %

          });
        });
      })
      .catch(err => {
        console.error("스트레스 요약 정보 불러오기 실패:", err);
        this.setState({ stressByDate: {}, maxStress: null });
      });
  }


HandleRangeChange = (startIso, endIso, viewType) => {
  this.setState(
    { start: startIso, end: endIso, currentView: viewType },
    () => {
      this.fetchStressSummary(startIso, endIso); // 최신값으로 계산
      this.HandleUpdate(startIso, endIso);       // 최신 범위로 일정 갱신
    }
  );
};

  handleEventClick = (id, _start, _end) => {
    console.log(_start, _end);
    window.location.href = `/editschedule?id=${id}&start=${_start}&end=${_end}`;
  };

  HandleEventClick(eventObj) {
    window.location.href = `/editschedule/${eventObj}`;
  }

  HandleUpdate = (_start, _end) => {
    // GET 요청을 보낼 때 axios는 params와 withCredentials를 같은 객체 안에 넣어야 합니다.
    axios
      .get(`${this.backendBaseUrl}/schedule`, {
        params: {
          start_time: _start,
          end_time: _end,
        },
        withCredentials: true, // 쿠키 전달
      })
      .then((response) => {
        const list = response.data; // 서버에서 ScheduleAll 배열을 받음
        this.setState({
          events: list.map((item) => ({
            id: item.schedule_id,
            title: item.schedule_name,
            start: item.start_time,
            end: item.end_time,
            location: item.location,
            memo: item.memo,
            final_end_date: item.final_end_date,
            stress_tag: item.stress_tag,
            controllable: item.controllable,
            notification_time: item.notification_time,
            repeat_check: item.repeat_check,
          })),
        });
      })
      .catch((err) => {
        console.error("일정 불러오기 실패:", err);
      });

    // 초기에 보이는 월 범위로 합계도 불러오기
    this.fetchStressSummary(this.state.start, this.state.end);
  };


  componentDidMount() {
   // ③ 첫 화면에 보이는 월 범위로 일정 한번 로드
    this.fetchStressSummary(this.state.start, this.state.end);    
    this.HandleUpdate(this.state.start, this.state.end);

  }

  render() {
    return (
      <div className="calendar">

        <Calendarcomponent
          events={this.state.events}
          onEventClick={this.handleEventClick}
          onRangeChange={this.HandleRangeChange}
          HandleUpdate={this.HandleUpdate}
          stressByDate={this.state.stressByDate}
          maxStress={this.state.maxStress}
        />

        <div className="calendar-bottom-container">
        <div className="calendar-bottom-row">

          <div className="stress-summary-inline">
            <span className="range-label">
              {this.state.currentView === "timeGridWeek" ? "이번 주"
              : this.state.currentView === "timeGridDay" ? "오늘" : "이번 달"}
            </span>

            {/* 하루 평균 스트레스 지수 */}
            <div className="metric">
              <span>📈 누적 스트레스 </span>
              <strong>{this.state.stressSum}</strong>
            </div>

            {/* 총합 / 해당 날짜 범위 maxStress (%) */}
            <div className="metric">
              <span>📊 최대 허용 스트레스 </span>
              <strong>
                {this.state.maxStress * this.state.daysInRange}
                
              </strong>
            </div>

            {/* 평균 공식 표시 */}
            <div className="metric">
              <span>🔥 사용량 </span>
              <strong>
                {this.state.stressUtil}%
              </strong>
            </div>
          </div>

            <input
              type="button"
              id="add-schedule"
              value="+ 일정 추가"
              onClick={function (e) {
                window.location.href = "/addschedule";
              }}
            />
        </div>
      </div>
      </div>
    );
  }
}

export default Calendar;
