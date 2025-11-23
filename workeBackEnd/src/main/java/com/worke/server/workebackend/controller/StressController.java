package com.worke.server.workebackend.controller;

import com.worke.server.workebackend.dto.ClientReq;
import com.worke.server.workebackend.dto.ClientRes;
import com.worke.server.workebackend.dto.SessionUser;
import com.worke.server.workebackend.dto.StressRes;
import com.worke.server.workebackend.entity.Client;
import com.worke.server.workebackend.service.ClientService;
import com.worke.server.workebackend.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/stress")
@RequiredArgsConstructor
public class StressController {
    private final ScheduleService scheduleService;

    @GetMapping("/summary")
    public ResponseEntity<?> getStressSummary(@AuthenticationPrincipal OAuth2User oAuth2User,
                                              @RequestParam("start_time") LocalDateTime startTime,
                                              @RequestParam("end_time") LocalDateTime endTime) {
        try {
            // 1. 우리가 만든 'ID만 든 객체'가 맞는지 확인
            if (oAuth2User instanceof SessionUser) {
                SessionUser sessionUser = (SessionUser) oAuth2User;

                Long myId = sessionUser.getClient_id(); // ID 꺼내기

                List<StressRes.StressSummaryInfo> stress= scheduleService.summaryStress(startTime,endTime,myId);
                return ResponseEntity.ok().body(stress);
            }

            // 2. 만약 SessionUser가 아니라면? -> 구글 정보(OAuth2User)가 들어있다는 뜻 -> 가입 안 한 사람
            return ResponseEntity.status(401).body("정회원이 아닙니다. 회원가입 해주세요.");
        }catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }
}
