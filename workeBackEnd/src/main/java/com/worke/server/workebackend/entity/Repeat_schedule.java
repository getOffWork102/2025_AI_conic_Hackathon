package com.worke.server.workebackend.entity;

import com.worke.server.workebackend.dto.ScheduleReq;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class Repeat_schedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long repeat_id;

    @Column(nullable = false)
    private Long client_id;

    @Column(nullable = false)
    private String schedule_name;

    private String location;
    private String memo;

    @Column(nullable = false)
    private LocalDateTime start_time;
    @Column(nullable = false)
    private LocalDateTime end_time;
    @Column(nullable = false)
    private DayOfWeek repeat_date;

    private LocalDate repeat_end_date;

    @Column(nullable = false)
    private Integer stress_tag;

    @Column(nullable = false)
    private Boolean controllable;

    private Integer notification_time;

    public void updateSchedule(ScheduleReq.ScheduleInfo newSchedule) {
        this.schedule_name= newSchedule.getSchedule_name();
        this.location = newSchedule.getLocation();
        this.memo = newSchedule.getMemo();
        this.start_time = newSchedule.getStart_time();
        this.end_time = newSchedule.getEnd_time();
        this.stress_tag = newSchedule.getStress_tag();
        this.controllable = newSchedule.getControllable();
        this.notification_time = newSchedule.getNotification_time();
    }

    public void updateDeleteDate(LocalDate new_end_date) {
        this.repeat_end_date = new_end_date;
    }
}
