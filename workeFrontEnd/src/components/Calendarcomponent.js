// CalendarComponent.jsx
import React, { Component } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

class CalendarComponent extends Component {
  render() {
    return (
      <FullCalendar
        initialView="dayGridMonth"

        datesSet={(arg) => {
          const startIso = arg.start.toISOString().replace(".000Z", "");
          const endIso = arg.end.toISOString().replace(".000Z", "");
          const viewType = arg.view?.type; // "dayGridMonth" / "timeGridWeek" / "timeGridDay"

          this.setState({ start: startIso, end: endIso });

          // Calendar.js(부모)에게 범위 전달
          this.props.onRangeChange && this.props.onRangeChange(startIso, endIso, viewType);
          this.props.HandleUpdate && this.props.HandleUpdate(startIso, endIso);
        }}

        navLinks={true}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        eventDisplay="block" 
        events={this.props.events}
        timeZone="Asia/Seoul"
        firstDay={0}
        weekends={true}
        headerToolbar={{
          start: "prev,next today",
          center: "title",
          end: "dayGridMonth timeGridWeek timeGridDay profile",
        }}
        customButtons={{
          profile: {
            text: "내 정보",
            click: () => {
              window.location.href = "/mypage";
            },
          },
        }}

        buttonText={{
          today: "오늘",
          month: "월",
          week: "주",
          day: "일",
        }}


        dayCellClassNames={(arg) => {
          return arg.isToday ? ["is-today"] : [];
        }}

        eventClick={(info) => {
          // 클릭된 이벤트 객체 찾
          this.props.onEventClick(
            info.event.id,
            info.event.start.toISOString().replace(".000Z", ""),
            info.event.end.toISOString().replace(".000Z", "")
          ); // 부모로 전달
        }}


        eventClassNames={(arg) => {
          const tag = arg.event.extendedProps?.stress_tag;
          if (tag === undefined || tag === null) return [];
          return [`evt-stress-${(tag ?? 0)}`];
        }}
      />
    );
  }
}

export default CalendarComponent;
