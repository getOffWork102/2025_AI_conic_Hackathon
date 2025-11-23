package com.worke.server.workebackend.scheduler;

import com.worke.server.workebackend.service.ClientService;
import com.worke.server.workebackend.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component // 스프링 빈으로 등록
@RequiredArgsConstructor
public class MidnightScheduler {

    private final ClientService clientService; // ★ 호출하고 싶은 서비스 주입
    private final ScheduleService scheduleService;

    // 매일 자정 (00시 00분 00초) 실행
    // cron = "초 분 시 일 월 요일"
    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")
    public void runMidnightTask() {
        log.info("🕛 자정 스케줄러 실행 시작!");

        try {
            scheduleService.createDailySchedules();
            scheduleService.deleteRepeat_schedule();
            log.info("✅ 자정 작업 완료");
        } catch (Exception e) {
            log.error("🔥 자정 작업 중 에러 발생", e);
        }
    }
}
