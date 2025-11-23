package com.worke.server.workebackend.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

public class ScheduleReq {
    @Builder
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleInfo {
        private String schedule_name;
        private String location;
        private String memo;
        //@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime start_time;
        //@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime end_time;
        //@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime final_end_date;
        private Integer stress_tag;
        private Boolean controllable;
        private Integer notification_time;
        private Boolean repeat_check;
    }
}
