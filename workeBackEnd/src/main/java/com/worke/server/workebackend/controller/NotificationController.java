package com.worke.server.workebackend.controller;

import com.worke.server.workebackend.dto.SessionUser;
import com.worke.server.workebackend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@RestController
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // 프론트엔드에서 EventSource로 이 주소를 호출함
    @GetMapping(value = "/api/notifications/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@AuthenticationPrincipal OAuth2User oAuth2User) {

        // 로그인 여부 확인 및 ID 추출
        if (oAuth2User instanceof SessionUser) {
            SessionUser sessionUser = (SessionUser) oAuth2User;
            Long clientId = sessionUser.getClient_id();

            log.info("SSE 연결 시도: 유저ID = {}", clientId);
            return notificationService.subscribe(clientId);
        }

        return null; // 로그인 안 했으면 연결 거부
    }
}