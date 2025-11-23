package com.worke.server.workebackend.repo;

import com.worke.server.workebackend.entity.Repeat_schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

public interface RepeatScheduleRepo extends JpaRepository<Repeat_schedule, Integer> {
    @Query("SELECT r FROM Repeat_schedule r WHERE r.client_id = :myId AND (r.repeat_end_date > :date OR r.repeat_end_date IS null)")
    List<Repeat_schedule> findByClient_idBeforeRepeat_end_date(Long myId, LocalDate date);

    @Query("SELECT SUM(r.stress_tag) " +
            "FROM Repeat_schedule r " +
            "WHERE r.client_id = :clientId " +
            "AND ( r.repeat_date = :dayOfWeek ) AND r.repeat_end_date > :date")
    Integer sumStressByDateWithRepeat(DayOfWeek dayOfWeek, LocalDate date,
                                      Long clientId);

    @Query("SELECT r FROM Repeat_schedule r WHERE r.repeat_id = :scheduleId")
    Repeat_schedule findByRepeat_id(Long scheduleId);

    @Query ("SELECT r FROM Repeat_schedule r WHERE r.repeat_date = :dayOfWeek")
    List<Repeat_schedule> findByRepeat_date(DayOfWeek dayOfWeek);

    @Modifying
    @Transactional
    @Query("DELETE FROM Repeat_schedule r WHERE r.repeat_end_date = :date")
    void deleteByRepeat_end_date(LocalDate now);

    @Modifying
    @Transactional
    @Query("DELETE FROM Repeat_schedule r WHERE r.client_id = :clientId")
    void deleteByClient_id(Long clientId);
}
