package com.worke.server.workebackend.service;

import com.worke.server.workebackend.entity.Schedule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationTaskService {

    private final TaskScheduler taskScheduler; // 아까 만든 알람 시계
    private final NotificationService notificationService; // 알림 발송 서비스(SSE)

    // 예약된 알림들을 관리하는 장부 (Key: 스케줄ID, Value: 예약증)
    private final Map<Long, ScheduledFuture<?>> scheduledTasks = new ConcurrentHashMap<>();

    // 1. 알림 예약 등록
    public void register(Schedule schedule) {
        if (schedule.getNotification_time() == null) return;

        // 기존에 예약된 게 있다면 취소 (수정된 경우 대비)
        cancel(schedule.getSchedule_id());

        // 실행할 작업 정의 (Runnable)
        Runnable task = () -> {
            notificationService.sendNotification(
                    schedule.getClient_id(),
                    schedule.getSchedule_name() + " 할 시간입니다!"
            );
            // 실행 후 장부에서 제거
            scheduledTasks.remove(schedule.getSchedule_id());
        };

        // ★ 핵심: 타이머 설정 (해당 시간에 실행해라!)
        ScheduledFuture<?> future = taskScheduler.schedule(
                task,
                schedule.getStart_time().minusMinutes(schedule.getNotification_time()).atZone(ZoneId.of("Asia/Seoul")).toInstant()
        );

        // 장부에 기록
        scheduledTasks.put(schedule.getSchedule_id(), future);
        log.info("알림 예약 완료: ID={}, 시간={}", schedule.getSchedule_id(), schedule.getStart_time().minusMinutes(schedule.getNotification_time()));
    }

    // 2. 알림 예약 취소 (일정 삭제/수정 시 호출)
    public void cancel(Long scheduleId) {
        ScheduledFuture<?> future = scheduledTasks.get(scheduleId);
        if (future != null) {
            future.cancel(false); // 예약 취소
            scheduledTasks.remove(scheduleId);
            log.info("알림 예약 취소: ID={}", scheduleId);
        }
    }
}
