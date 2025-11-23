import React, { Component } from "react";
import Calendarcomponent from "../components/Calendarcomponent";
import axios from "axios";
import "./Calendar.css";

class Calendar extends Component {
  backendBaseUrl = "http://localhost:8080";

  constructor(props) {
    super(props);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    this.state = {
      start: startOfMonth.toISOString().replace(".000Z", ""),
      end: endOfMonth.toISOString().replace(".000Z", ""),
      events: [],
      stressByDate: {},
      maxStress: 0,
      stressSum: 0,
      stressAvg: 0,
      stressUtil: 0,
      currentView: "dayGridMonth",
      daysInRange: 0,
    };
  }

  // 기존 함수 (단순 차이 계산) - 주간/일간 뷰에서 사용
  inclusiveDays(startIso, endIso) {
    const s = new Date(startIso);
    const e = new Date(endIso);
    const sUTC = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
    const eUTC = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());
    return Math.max(1, Math.floor((eUTC - sUTC) / 86400000)); // end가 exclusive일 수 있으니 +1 조정 필요하면 확인
  }

  // ★ [추가됨] 진짜 그 달의 일수를 구하는 함수
  getRealDaysCount(startIso, endIso, viewType) {
    // 1. 월간 뷰일 때: 화면에 보이는 날짜가 아니라 "그 달의 실제 일수"를 구함
    if (viewType === "dayGridMonth") {
      // 범위의 '중간 날짜'를 찾으면 그게 바로 현재 보고 있는 달입니다.
      // (시작일은 지난달, 종료일은 다음달일 수 있기 때문)
      const s = new Date(startIso);
      const e = new Date(endIso);
      const midDate = new Date((s.getTime() + e.getTime()) / 2);

      const year = midDate.getFullYear();
      const month = midDate.getMonth();

      // 해당 월의 마지막 날짜 가져오기 (0을 넣으면 이전달의 마지막 날 즉, 현재달의 마지막 날)
      return new Date(year, month + 1, 0).getDate();
    } 
    
    // 2. 주간/일간 뷰일 때: 그냥 차이 계산 (FullCalendar는 주간뷰에서 7일치 범위를 줌)
    return this.inclusiveDays(startIso, endIso);
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
          
          // ★ 중요: 스트레스 합계 계산 시, "현재 달"에 포함되는 데이터만 더할지, 
          // 아니면 화면에 보이는 건 다 더할지 결정해야 합니다.
          // 여기서는 "화면에 보이는 전체 스트레스"를 보여주되, 기준(분모)을 맞추는 방식으로 갑니다.
          // 만약 "이번 달 것만" 더하고 싶다면 아래 forEach에서 날짜 필터링을 해야 합니다.
          
          sumRes.data.forEach(item => {
            const key = item.date.slice(0, 10);
            const v = item.total_stress ?? 0;
            map[key] = v; 
            accumulation += v;
          });

          // ★ [수정됨] 기간 일수 계산 로직 변경
          // this.state.currentView를 사용하여 정확한 일수 계산
          const realDays = this.getRealDaysCount(startIso, endIso, this.state.currentView);

          const avg = accumulation / realDays;
          const periodMax = (max ?? 0) * realDays; // 이제 30일 * maxStress가 됨
          const util = periodMax > 0 ? (accumulation / periodMax) * 100 : null;

          this.setState({
            stressByDate: map,
            maxStress: max,
            daysInRange: realDays, // 화면 표시용
            stressSum: accumulation,
            stressAvg: Number.isFinite(avg) ? Number(avg.toFixed(2)) : 0,
            stressUtil: util != null ? Number(util.toFixed(1)) : null,
          });
        });
      })
      .catch(err => {
        console.error("스트레스 요약 정보 불러오기 실패:", err);
        this.setState({
          stressByDate: {},
          maxStress: 0,
          daysInRange: 0,
          stressSum: 0,
          stressAvg: 0,
          stressUtil: 0,
        });
      });
  }

  HandleRangeChange = (startIso, endIso, viewType) => {
    this.setState(
      { start: startIso, end: endIso, currentView: viewType },
      () => {
        this.fetchStressSummary(startIso, endIso); 
        this.HandleUpdate(startIso, endIso);       
      }
    );
  };

  handleEventClick = (id, _start, _end) => {
    let finalId = id;
    if (String(id).startsWith("repeat-") || String(id).startsWith("normal-")) {
        finalId = String(id).split("-")[1];
    }
    const cleanStart = _start ? _start.replace("Z", "").replace("+09:00", "") : "";
    const cleanEnd = _end ? _end.replace("Z", "").replace("+09:00", "") : "";

    window.location.href = `/editschedule?id=${finalId}&start=${cleanStart}&end=${cleanEnd}`;
  };

  HandleUpdate = (_start, _end) => {
    axios
      .get(`${this.backendBaseUrl}/schedule`, {
        params: {
          start_time: _start,
          end_time: _end,
        },
        withCredentials: true,
      })
      .then((response) => {
        const list = response.data;
        
        this.setState({
          events: list.map((item) => {
            const uniqueId = item.repeat_check 
                ? `repeat-${item.schedule_id}-${item.start_time}` 
                : `normal-${item.schedule_id}`;

            return {
                id: uniqueId,
                title: item.schedule_name,
                start: item.start_time,
                end: item.end_time,
                extendedProps: {
                    realId: item.schedule_id,
                    isRepeat: item.repeat_check
                },
                location: item.location,
                memo: item.memo,
                final_end_date: item.final_end_date,
                stress_tag: item.stress_tag,
                controllable: item.controllable,
                notification_time: item.notification_time,
                repeat_check: item.repeat_check,
                backgroundColor: item.repeat_check ? "#FFF0F0" : "#E3F2FD",
                borderColor: item.repeat_check ? "#FFCDD2" : "#90CAF9",
                textColor: "#333"
            };
          }),
        });
      })
      .catch((err) => {
        console.error("일정 불러오기 실패:", err);
      });

    this.fetchStressSummary(this.state.start, this.state.end);
  };

  componentDidMount() {
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

            <div className="metric">
              <span>📈 누적 스트레스 </span>
              <strong>{this.state.stressSum}</strong>
            </div>

            <div className="metric">
              <span>📊 최대 허용 스트레스 </span>
              <strong>
                {/* 여기서 daysInRange는 이제 '진짜 그 달의 일수'가 됩니다 */}
                {this.state.maxStress * this.state.daysInRange}
              </strong>
            </div>

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