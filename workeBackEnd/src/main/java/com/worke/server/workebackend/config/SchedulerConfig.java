package com.worke.server.workebackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

@Configuration
public class SchedulerConfig {

    @Bean
    public ThreadPoolTaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(5); // 동시에 5개 알림까지 처리 가능 (필요 시 늘림)
        scheduler.setThreadNamePrefix("Noti-Scheduler-");
        scheduler.initialize();
        return scheduler;
    }
}