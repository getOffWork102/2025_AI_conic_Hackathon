package com.worke.server.workebackend.repo;

import com.worke.server.workebackend.dto.ScheduleRes;
import com.worke.server.workebackend.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

public interface ScheduleRepo extends JpaRepository<Schedule, Integer> {
    @Query(
            "SELECT new com.worke.server.workebackend.dto.ScheduleRes$ScheduleAll(" +
                    "s.schedule_id, s.schedule_name, s.location, s.memo, " +
                    "s.start_time, s.end_time, s.final_end_date, s.stress_tag, s.controllable, s.notification_time, false)" +
                    "FROM Schedule s " +
                    "WHERE s.start_time < :end AND s.end_time > :start " +
                    "AND s.client_id = :clientId")
    List<ScheduleRes.ScheduleAll> findByStartTimeBetweenAndClient_id(
            LocalDateTime start,
            LocalDateTime end,
            Long clientId
    );

    @Query("SELECT SUM(s.stress_tag) " +
            "FROM Schedule s " +
            "WHERE s.client_id = :clientId " +
            "AND s.start_time < :dayEnd " +
            "AND s.end_time > :dayStart")
    Integer sumStressByDate(LocalDateTime dayStart, LocalDateTime dayEnd, Long clientId);



    @Query("SELECT s FROM Schedule s WHERE s.schedule_id = :scheduleId")
    Schedule findBySchedule_id(Long scheduleId);

    @Query("SELECT s FROM Schedule s WHERE s.notification_time IS NOT NULL AND s.start_time > :current")
    List<Schedule> findAllFutureNotifications(LocalDateTime current);

    @Modifying
    @Transactional
    @Query("DELETE FROM Schedule s WHERE s.client_id = :clientId")
    void deleteByClient_id(Long clientId);
}
