package com.worke.server.workebackend.config;

import com.worke.server.workebackend.entity.Schedule;
import com.worke.server.workebackend.repo.ScheduleRepo;
import com.worke.server.workebackend.service.NotificationTaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SchedulerInitializer {

    private final ScheduleRepo scheduleRepo;
    private final NotificationTaskService notificationTaskService;

    // 서버 켜지자마자 딱 1번 실행
    @EventListener(ApplicationReadyEvent.class)
    public void init() {
        log.info("서버 재시작: 알림 예약 복구 시작...");
        LocalDateTime now = LocalDateTime.now();
        // 현재 시간 이후에 울려야 할 알림들을 DB에서 조회
        List<Schedule> futureSchedules = scheduleRepo.findAllFutureNotifications(LocalDateTime.now());

        for (Schedule s : futureSchedules) {
            LocalDateTime alarmTime = s.getStart_time().minusMinutes(s.getNotification_time());

            if (alarmTime.isAfter(now)) {
                notificationTaskService.register(s);
            }
        }

        log.info("복구 완료: 총 {}건 예약됨", futureSchedules.size());
    }
}