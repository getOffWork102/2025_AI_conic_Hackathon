package com.worke.server.workebackend.controller;

import com.worke.server.workebackend.dto.AiDto;
import com.worke.server.workebackend.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    // AI 일정 재배치 추천
    @GetMapping("/rearrangement/{schedule_id}/{err}")
    public ResponseEntity<AiDto.RecommendDate> recommendSchedule(
            @PathVariable("schedule_id") Long scheduleId,
            @PathVariable("err") Integer err) {

        AiDto.RecommendDate recommendation = aiService.getRearrangedSchedule(scheduleId, err);
        return ResponseEntity.ok(recommendation);
    }
}