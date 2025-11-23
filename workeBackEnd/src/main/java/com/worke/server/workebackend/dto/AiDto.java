package com.worke.server.workebackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class AiDto {

    // 1. 프론트엔드 응답용 (사용자가 원한 포맷)
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RecommendDate {
        private Long schedule_id;
        private LocalDateTime start_time;
        private LocalDateTime end_time;
    }

    // 2. OpenAI 요청용 DTO
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatRequest {
        private String model;
        private List<Message> messages;
        private double temperature; // 창의성 조절 (0.0 ~ 1.0)
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Message {
        private String role; // "system" or "user"
        private String content;
    }

    // 3. OpenAI 응답용 DTO
    @Data
    @NoArgsConstructor
    public static class ChatResponse {
        private List<Choice> choices;

        @Data
        public static class Choice {
            private Message message;
        }
    }
}