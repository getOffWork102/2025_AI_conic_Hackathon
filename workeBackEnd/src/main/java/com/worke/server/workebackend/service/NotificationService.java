package com.worke.server.workebackend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class NotificationService {

    // 접속한 유저들의 연결 통로를 저장하는 금고 (Key: 유저ID, Value: 통신선)
    private static final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    // 1. [프론트 -> 백엔드] 연결 요청 처리 (구독)
    public SseEmitter subscribe(Long clientId) {
        // 연결 지속 시간 설정 (Long.MAX_VALUE = 거의 무한대)
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        // 금고에 저장
        emitters.put(clientId, emitter);

        // 연결이 끊기거나 에러 나면 금고에서 제거
        emitter.onCompletion(() -> emitters.remove(clientId));
        emitter.onTimeout(() -> emitters.remove(clientId));
        emitter.onError((e) -> emitters.remove(clientId));

        // 503 에러 방지를 위해 처음 연결 시 '더미 데이터' 하나 전송
        try {
            emitter.send(SseEmitter.event()
                    .name("connect") // 이벤트 이름
                    .data("connected!")); // 데이터
        } catch (IOException e) {
            emitters.remove(clientId);
        }

        return emitter;
    }

    // 2. [서버 -> 프론트] 알림 전송 (TaskScheduler가 이걸 호출함)
    public void sendNotification(Long clientId, String message) {
        SseEmitter emitter = emitters.get(clientId);

        // 해당 유저가 접속해 있다면
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("alarm") // 프론트에서 .addEventListener("alarm")으로 받음
                        .data(message));
                log.info("🔔 알림 전송 성공: 유저ID={}, 내용={}", clientId, message);
            } catch (IOException e) {
                emitters.remove(clientId); // 전송 실패 시 제거
                log.error("알림 전송 실패", e);
            }
        } else {
            log.info("🔕 알림 전송 실패: 유저({})가 접속해 있지 않음", clientId);
        }
    }
}