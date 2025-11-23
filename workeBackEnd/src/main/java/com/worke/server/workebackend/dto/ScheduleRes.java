package com.worke.server.workebackend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

public class ScheduleRes {
    @Builder
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleAll {
        private Long schedule_id;
        private String schedule_name;
        private String location;
        private String memo;
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime start_time;
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime end_time;
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime final_end_date;
        private Integer stress_tag;
        private Boolean controllable;
        private Integer notification_time;
        private Boolean repeat_check;
    }

    @Builder
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class error {
        private Integer err;
        private LocalDate mess_date;
    }
}
