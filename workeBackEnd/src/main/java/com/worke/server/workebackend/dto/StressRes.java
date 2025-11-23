package com.worke.server.workebackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

public class StressRes {
    @Builder
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StressSummaryInfo {
        private LocalDate date;
        private Integer total_stress;
    }
}
