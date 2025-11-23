package com.worke.server.workebackend.controller;

import com.worke.server.workebackend.dto.ClientReq;
import com.worke.server.workebackend.dto.ScheduleReq;
import com.worke.server.workebackend.dto.ScheduleRes;
import com.worke.server.workebackend.dto.SessionUser;
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

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/schedule")
@RequiredArgsConstructor
public class ScheduleController {
    private final ScheduleService scheduleService;

    @PostMapping("")
    public ResponseEntity<?> AddSchedule(@AuthenticationPrincipal OAuth2User oAuth2User, @RequestBody ScheduleReq.ScheduleInfo req) {
        try {
            log.info("Controller 진입: req={}", req);
            //client id 확인
            if (oAuth2User instanceof SessionUser) {
                SessionUser sessionUser = (SessionUser) oAuth2User;

                Long myId = sessionUser.getClient_id();
                log.info("Controller id확인");
                Long scheduleId = scheduleService.save(req, myId);

                return ResponseEntity.ok(scheduleId);
            }

            return ResponseEntity.status(401).body("정회원이 아닙니다. 회원가입 해주세요.");
        }catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    @GetMapping("")
    public ResponseEntity<?> GetSchedule(@AuthenticationPrincipal OAuth2User oAuth2User,
                                         @RequestParam("start_time") LocalDateTime startTime,
                                         @RequestParam("end_time") LocalDateTime endTime) {
        try {
            //client id 확인
            if (oAuth2User instanceof SessionUser) {
                SessionUser sessionUser = (SessionUser) oAuth2User;

                Long myId = sessionUser.getClient_id();

                List<ScheduleRes.ScheduleAll> res = scheduleService.getSchedule(startTime, endTime, myId);
                return ResponseEntity.ok(res);
            }

            return ResponseEntity.status(401).body("정회원이 아닙니다. 회원가입 해주세요.");
        }catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    @GetMapping("/{schedule_id}")
    public ResponseEntity<?> GetScheduleById(@AuthenticationPrincipal OAuth2User oAuth2User,
                                         @PathVariable Long schedule_id) {
        try {
            //client id 확인
            if (oAuth2User instanceof SessionUser) {
                SessionUser sessionUser = (SessionUser) oAuth2User;

                Long myId = sessionUser.getClient_id();

                ScheduleRes.ScheduleAll res = scheduleService.getScheduleByScheduleId(schedule_id);
                return ResponseEntity.ok(res);
            }

            return ResponseEntity.status(401).body("정회원이 아닙니다. 회원가입 해주세요.");
        }catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    @GetMapping("/conflict")
    public ResponseEntity<?> GetSchedule(@AuthenticationPrincipal OAuth2User oAuth2User,
                                         @RequestParam("start_time") LocalDateTime start_time,
                                         @RequestParam("end_time") LocalDateTime end_time,
                                         @RequestParam("stress_tag") Integer stress_tag) {
        try {
            //client id 확인
            if (oAuth2User instanceof SessionUser) {
                SessionUser sessionUser = (SessionUser) oAuth2User;

                Long myId = sessionUser.getClient_id();

                ScheduleRes.error err = scheduleService.findConflict(start_time,end_time,stress_tag,myId);
                return ResponseEntity.ok(err);
            }

            return ResponseEntity.status(401).body("정회원이 아닙니다. 회원가입 해주세요.");
        }catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    @PatchMapping("/{schedule_id}")
    public ResponseEntity<?> UpdateSchedule(@AuthenticationPrincipal OAuth2User oAuth2User,
                                            @PathVariable Long schedule_id,
                                            @RequestBody ScheduleReq.ScheduleInfo req) {
        try {
            //client id 확인
            if (oAuth2User instanceof SessionUser) {
                SessionUser sessionUser = (SessionUser) oAuth2User;

                Long myId = sessionUser.getClient_id();

                Integer check = scheduleService.updateSchedule(schedule_id,req,myId);
                if(check == 1)
                    return ResponseEntity.status(402).body("회원 수정 권한이 없습니다.");
                return ResponseEntity.ok(200);
            }

            return ResponseEntity.status(401).body("정회원이 아닙니다. 회원가입 해주세요.");
        }catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    @DeleteMapping("")
    public ResponseEntity<?> GetSchedule(@AuthenticationPrincipal OAuth2User oAuth2User,
                                         @RequestParam("end_time") LocalDateTime end_time,
                                         @RequestParam("schedule_id") Long schedule_id) {
        try {
            //client id 확인
            if (oAuth2User instanceof SessionUser) {
                SessionUser sessionUser = (SessionUser) oAuth2User;

                Long myId = sessionUser.getClient_id();

                Integer check = scheduleService.delete(schedule_id, end_time, myId);
                if (check == 1) {
                    return ResponseEntity.status(402).body("일정을 수정할 수 있는 권한이 없습니다.");
                }
                return ResponseEntity.ok(200);
            }

            return ResponseEntity.status(401).body("정회원이 아닙니다. 회원가입 해주세요.");
        }catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }
}
