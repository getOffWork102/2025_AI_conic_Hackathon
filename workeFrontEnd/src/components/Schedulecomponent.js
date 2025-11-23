import React, { Component } from "react";

class schedulecomponent extends Component {
  validate = () => {
    const startD = document.getElementById("start_date").value;
    const startT = document.getElementById("start_time").value;

    const endD = document.getElementById("end_date").value;
    const endT = document.getElementById("end_time").value;

    const finalD = document.getElementById("final_date").value;
    const finalT = document.getElementById("final_time").value;

    if (!startD || !startT || !endD || !endT || !finalD || !finalT) {
      alert("모든 날짜/시간을 입력해야 합니다.");
      return false;
    }

    const start = new Date(`${startD}T${startT}`);
    const end = new Date(`${endD}T${endT}`);
    const final = new Date(`${finalD}T${finalT}`);

    if (start > end) {
      alert("시작 시간이 종료 시간보다 늦을 수 없습니다.");
      return false;
    }
    if (end > final) {
      alert("종료 시간이 마감 시간보다 늦을 수 없습니다.");
      return false;
    }
    return true;
  };
  render() {
    const startTime = this.props.start_time || "";
    const endTime = this.props.end_time || "";
    const finalEndDate = this.props.final_end_date || "";

    const [start_date, start_time] = startTime.split("T");
    const [end_date, end_time] = endTime.split("T");
    const [final_date, final_time] = finalEndDate.split("T");

    return (
      <section className="schedule" id="schedule-section">
        <div className="schedule" id="schedule-div">
          <h2 className="schedule" id="schedule-title">
            {this.props.title}
          </h2>
          <form
            className="schedule"
            id="schedule-form"
            onSubmit={function (e) {
              e.preventDefault();
              this.props.onSubmit(
                e.target[0].value,
                e.target[1].value,
                e.target[2].value,
                `${e.target[3].value}T${e.target[4].value || "00:00:00"}`,
                `${e.target[5].value}T${e.target[6].value || "23:59:00"}`,
                `${e.target[7].value}T${e.target[8].value || "00:00:00"}`,
                e.target[9].checked,
                e.target[10].checked,
                e.target[11].value,
                e.target[12].value
              );

              alert("APPLY Successful!");
            }.bind(this)}
          >
            <div id="row1">
              <p className="schedule">
                <label className="schedule" htmlFor="title" id="title-field">
                  제목
                  <input
                    className="schedule"
                    type="text"
                    id="title"
                    defaultValue={this.props.schedule_name}
                  ></input>
                </label>
              </p>
              <p className="schedule">
                <label
                  className="schedule"
                  id="location-field"
                  htmlFor="location"
                >
                  장소
                  <input
                    className="schedule"
                    type="text"
                    id="location"
                    defaultValue={this.props.location}
                  ></input>
                </label>
              </p>
              <p>
                <label className="schedule" htmlFor="stress" id="stress-field">
                  스트레스
                  <input
                    className="schedule"
                    type="number"
                    id="stress"
                    placeholder="1-5"
                    min="1"
                    max="5"
                    step="1"
                    defaultValue={this.props.stress_tag}
                    required
                  ></input>
                  <small className="required-msg">※ 반드시 입력해야 합니다.</small>
                </label>
              </p>
            </div>
            <div id="row2">
              <p className="schedule">
                <label
                  className="schedule"
                  htmlFor="start_time"
                  id="start_field"
                >
                  시작
                  <input
                    className="schedule"
                    type="date"
                    id="start_date"
                    defaultValue={start_date}
                    noValidate
                  ></input>
                  <input
                    className="schedule"
                    type="time"
                    id="start_time"
                    defaultValue={start_time}
                    noValidate
                  ></input>
                </label>
              </p>
              <p className="schedule">
                <label className="schedule" htmlFor="end_date" id="end_field">
                  종료
                  <input
                    className="schedule"
                    type="date"
                    id="end_date"
                    defaultValue={end_date}
                    noValidate
                  ></input>
                  <input
                    className="schedule"
                    type="time"
                    id="end_time"
                    defaultValue={end_time}
                    noValidate
                  ></input>
                </label>
              </p>
              <p className="schedule">
                <label
                  className="schedule"
                  htmlFor="final_date"
                  id="final_field"
                >
                  마감
                  <input
                    className="schedule"
                    type="date"
                    id="final_date"
                    defaultValue={final_date}
                    noValidate
                  ></input>
                  <input
                    className="schedule"
                    type="time"
                    id="final_time"
                    defaultValue={final_time}
                    noValidate
                  ></input>
                </label>
              </p>
            </div>
            <div className="schedule" id="row3">
              <div className="schedule" id="controllable-field">
                <label htmlFor="controllabe" id="controllable-label">
                  통제가능여부
                  <input
                    type="checkbox"
                    id="controllable"
                    defaultChecked={this.props.controllable}
                  />
                </label>
              </div>
              <div className="schedule" id="repeat-field">
                <label htmlFor="repeat" id="repeat-label">
                  반복여부
                  <input
                    type="checkbox"
                    id="repeat"
                    defaultChecked={this.props.repeat_check}
                  />
                </label>
              </div>

              <p>
                <label
                  className="schedule"
                  htmlFor="notification_time"
                  id="notification-field"
                >
                  알림설정
                  <select
                    className="schedule"
                    type="text"
                    id="notification_time"
                    defaultValue={String(this.props.notification_time)}
                  >
                    <option value="null">없음</option>
                    <option value="0">이벤트 시간</option>
                    <option value="5">5분 전</option>
                    <option value="10">10분 전</option>
                    <option value="15">15분 전</option>
                    <option value="30">30분 전</option>
                    <option value="60">1시간 전</option>
                    <option value="1440">1일 전</option>
                    <option value="2880">2일 전</option>
                    <option value="10800">1주일 전</option>
                  </select>
                </label>
              </p>
            </div>
            <p>
              <label className="schedule" htmlFor="memo" id="memo-field">
                메모
                <input className="schedule" type="text" id="memo"></input>
              </label>
            </p>
            <div className="schedule" id="button-row">
              <p>
                <input
                  className="schedule"
                  type="submit"
                  id="apply"
                  value={this.props.btn1}
                ></input>
              </p>
              <p>
                <input
                  className="schedule"
                  type="button"
                  id="delete"
                  value={this.props.btn2}
                  onClick={this.props.onClick}
                ></input>
              </p>
            </div>
          </form>
        </div>
      </section>
    );
  }
}

export default schedulecomponent;
