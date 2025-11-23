package com.worke.server.workebackend.entity;

import com.worke.server.workebackend.dto.ScheduleReq;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class Schedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long schedule_id;

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

    private LocalDateTime final_end_date;

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
        this.final_end_date = newSchedule.getFinal_end_date();
        this.stress_tag = newSchedule.getStress_tag();
        this.controllable = newSchedule.getControllable();
        this.notification_time = newSchedule.getNotification_time();
    }
}
