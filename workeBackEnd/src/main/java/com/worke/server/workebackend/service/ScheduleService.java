package com.worke.server.workebackend.service;


import com.worke.server.workebackend.dto.ScheduleReq;
import com.worke.server.workebackend.dto.ScheduleRes;
import com.worke.server.workebackend.dto.StressRes;
import com.worke.server.workebackend.entity.Client;
import com.worke.server.workebackend.entity.Repeat_schedule;
import com.worke.server.workebackend.entity.Schedule;
import com.worke.server.workebackend.repo.ClientRepo;
import com.worke.server.workebackend.repo.RepeatScheduleRepo;
import com.worke.server.workebackend.repo.ScheduleRepo;
import jakarta.transaction.Transactional;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Getter
@Setter
@Transactional
public class ScheduleService {
    private final ScheduleRepo scheduleRepo;
    private final RepeatScheduleRepo repeatScheduleRepo;
    private final ClientRepo clientRepo;
    private final NotificationTaskService notificationTaskService;

    public ScheduleService(ScheduleRepo scheduleRepo, RepeatScheduleRepo repeatScheduleRepo, ClientRepo clientRepo, NotificationTaskService notificationTaskService) {
        this.scheduleRepo = scheduleRepo;
        this.repeatScheduleRepo = repeatScheduleRepo;
        this.clientRepo = clientRepo;
        this.notificationTaskService = notificationTaskService;
    }

    @Transactional
    public Long save(ScheduleReq.ScheduleInfo req, Long client_Id) {
        Long resId;
        log.info("Service save 호출: req={}, clientId={}", req, client_Id);
        if(req.getRepeat_check()){ //반복일정
            log.info("Service save 호출: req={}, clientId={}", req, client_Id);
        Repeat_schedule repeatSchedule = Repeat_schedule.builder()
                .client_id(client_Id)
                .schedule_name(req.getSchedule_name())
                .location(req.getLocation())
                .memo(req.getMemo())
                .start_time(req.getStart_time())
                .end_time(req.getEnd_time())
                .repeat_date(req.getStart_time().getDayOfWeek())
                .stress_tag(req.getStress_tag())
                .controllable(req.getControllable())
                .notification_time(req.getNotification_time())
                .build();

                Repeat_schedule scheduleRes =repeatScheduleRepo.save(repeatSchedule);

                LocalDate current = req.getStart_time().toLocalDate();

                LocalTime startTime =  req.getStart_time().toLocalTime();
                LocalTime  endTime = req.getEnd_time().toLocalTime();
            while(!current.isAfter(LocalDate.now())) {
                    Schedule schedule = Schedule.builder()
                            .client_id(client_Id)
                            .schedule_name(req.getSchedule_name())
                            .location(req.getLocation())
                            .memo(req.getMemo())
                            .start_time(LocalDateTime.of(current, startTime))
                            .end_time(LocalDateTime.of(current, endTime))
                            .final_end_date(req.getFinal_end_date())
                            .stress_tag(req.getStress_tag())
                            .controllable(req.getControllable())
                            .notification_time(req.getNotification_time())
                            .build();

                    scheduleRepo.save(schedule);

                    current = current.plusDays(7);
                }
            resId = scheduleRes.getRepeat_id();
            log.info("Service save 호출: req={}, clientId={}", req, client_Id);
        }
        else{

            log.info("Service save 호출: req={}, clientId={}", req, client_Id);
            Schedule schedule = Schedule.builder()
                    .client_id(client_Id)
                    .schedule_name(req.getSchedule_name())
                    .location(req.getLocation())
                    .memo(req.getMemo())
                    .start_time(req.getStart_time())
                    .end_time(req.getEnd_time())
                    .final_end_date(req.getFinal_end_date())
                    .stress_tag(req.getStress_tag())
                    .controllable(req.getControllable())
                    .notification_time(req.getNotification_time())
                    .build();

            Schedule scheduleRes = scheduleRepo.save(schedule);
            resId = scheduleRes.getSchedule_id();
            log.info("Service save 호출: req={}, clientId={}", req, client_Id);
            notificationTaskService.register(schedule);
        }
        return resId;
    }

    public List<ScheduleRes.ScheduleAll> getSchedule(LocalDateTime startTime, LocalDateTime endTime, Long myId) {
        List<ScheduleRes.ScheduleAll> res = new ArrayList<>();

        // 1. [공통] 기간 내의 '확정된 스케줄(Schedule 테이블)' 조회
        List<ScheduleRes.ScheduleAll> concreteSchedules = scheduleRepo.findByStartTimeBetweenAndClient_id(startTime, endTime, myId)
                .stream()
                .map(s -> ScheduleRes.ScheduleAll.builder()
                        .schedule_id(s.getSchedule_id())
                        .schedule_name(s.getSchedule_name())
                        .location(s.getLocation())
                        .memo(s.getMemo())
                        .start_time(s.getStart_time())
                        .end_time(s.getEnd_time())
                        .final_end_date(s.getFinal_end_date())
                        .stress_tag(s.getStress_tag())
                        .controllable(s.getControllable())
                        .notification_time(s.getNotification_time())
                        .repeat_check(false)
                        .build())
                .collect(Collectors.toList());

        res.addAll(concreteSchedules);

        // 2. [반복 일정 계산]
        // 로직 수정: "오늘"을 포함해서 미래를 계산해야 방금 등록한 반복 일정도 오늘 날짜에 보임
        LocalDate today = LocalDate.now().plusDays(1);
        LocalDate searchStart = startTime.toLocalDate();
        LocalDate searchEnd = endTime.toLocalDate();

        // 계산 시작일(calcStart) 결정
        // 조회 시작일이 "오늘"보다 과거라면 -> "오늘"부터 계산 (과거는 위에서 DB조회로 처리했으므로)
        // 조회 시작일이 "오늘" 또는 "미래"라면 -> "조회 시작일"부터 계산
        LocalDate calcStart = searchStart.isBefore(today) ? today : searchStart;

        // 만약 계산 시작일이 조회 종료일보다 뒤라면? (예: 완전 과거 조회) -> 반복 계산 안 함
        if (calcStart.isAfter(searchEnd)) {
            return res;
        }

        // 반복 데이터 조회
        List<Repeat_schedule> repeatList = repeatScheduleRepo.findByClient_idBeforeRepeat_end_date(myId, searchEnd);
        Map<DayOfWeek, List<Repeat_schedule>> repeatMap = repeatList.stream()
                .collect(Collectors.groupingBy(Repeat_schedule::getRepeat_date));

        LocalDate current = calcStart;

        // 3. 반복 루프
        while (!current.isAfter(searchEnd)) {
            DayOfWeek todayOfWeek = current.getDayOfWeek();

            if (repeatMap.containsKey(todayOfWeek)) {
                List<Repeat_schedule> todaySchedules = repeatMap.get(todayOfWeek);

                for (Repeat_schedule rs : todaySchedules) {
                    // 날짜 갈아끼우기
                    LocalDateTime realStart = LocalDateTime.of(current, rs.getStart_time().toLocalTime());
                    LocalDateTime realEnd = LocalDateTime.of(current, rs.getEnd_time().toLocalTime());

                    // 반복 종료일 체크 (DB 쿼리 보완용)
                    if (rs.getRepeat_end_date() != null && current.isAfter(rs.getRepeat_end_date())) {
                        continue;
                    }

                    ScheduleRes.ScheduleAll schedule = ScheduleRes.ScheduleAll.builder()
                            .schedule_id(rs.getRepeat_id())
                            .schedule_name(rs.getSchedule_name())
                            .location(rs.getLocation())
                            .memo(rs.getMemo())
                            .start_time(realStart)
                            .end_time(realEnd)
                            // ★ [수정] 여기가 에러 원인이었습니다. null 체크 추가!
                            .final_end_date(rs.getRepeat_end_date() != null
                                    ? LocalDateTime.of(rs.getRepeat_end_date(), LocalTime.MAX)
                                    : null)
                            .stress_tag(rs.getStress_tag())
                            .controllable(rs.getControllable())
                            .notification_time(rs.getNotification_time())
                            .repeat_check(true)
                            .build();

                    res.add(schedule);
                }
            }
            current = current.plusDays(1);
        }

        return res;
    }


    public Integer delete(Long scheduleId, LocalDateTime end, Long myId) {
        // scheduleRepo 먼저 체크
        Schedule schedule = scheduleRepo.findBySchedule_id(scheduleId);
        if(schedule != null && myId.equals(schedule.getClient_id())) {
            if(myId != schedule.getClient_id())
                return 1;
            notificationTaskService.cancel(scheduleId);
            scheduleRepo.delete(schedule);
            return 0;
        }

        // repeatScheduleRepo 체크
        Repeat_schedule repeat = repeatScheduleRepo.findByRepeat_id(scheduleId);
        if(repeat != null && myId.equals(repeat.getClient_id())) {
            if(myId != schedule.getClient_id())
                return 1;
            repeat.updateDeleteDate(end.toLocalDate().plusDays(1));
            return 0;
        }
        return 1;
    }

    public Integer updateSchedule(Long schedule_id, ScheduleReq.ScheduleInfo req, Long myId) {
        // scheduleRepo 먼저 체크
        Schedule schedule = scheduleRepo.findBySchedule_id(schedule_id);
        if(schedule != null && myId.equals(schedule.getClient_id())) {
            schedule.updateSchedule(req);
            notificationTaskService.cancel(schedule.getSchedule_id());
            notificationTaskService.register(schedule);
            return 0;
        }

        // repeatScheduleRepo 체크
        Repeat_schedule repeat = repeatScheduleRepo.findByRepeat_id(schedule_id);
        if(repeat != null && myId.equals(repeat.getClient_id())) {
            repeat.updateSchedule(req);
            return 0;
        }
        return 1;
    }
    //자정 반복 일정을 schedule로 업데이트 /////////////delete도 같이 함
    public void createDailySchedules() {
        LocalDateTime now = LocalDateTime.now(); // 현재 (자정 직후)
        LocalDate todayDate = now.toLocalDate(); // 오늘 날짜 (예: 2023-11-21)

        // 1. 유효한 반복 스케줄 모두 가져오기
        List<Repeat_schedule> activeRepeats = repeatScheduleRepo.findByRepeat_date(now.getDayOfWeek());

        for (Repeat_schedule repeat : activeRepeats) {
            if(repeat.getRepeat_end_date()==todayDate||repeat.getRepeat_end_date().isBefore(todayDate)){
                repeatScheduleRepo.delete(repeat);
                continue;
            }
            // 2. 시간 결합하기 (오늘 날짜 + 반복 스케줄의 시간)
            // 예: 오늘(11월21일) + 반복시작(10:00) => 11월21일 10:00
            LocalDateTime newStartTime = LocalDateTime.of(todayDate, repeat.getStart_time().toLocalTime());
            LocalDateTime newEndTime = LocalDateTime.of(todayDate, repeat.getEnd_time().toLocalTime());

            // 3. 유저 정보 가져오기 (Schedule 테이블에 user_email, max_stress가 필수라면)
            // repeat.getClient_id()로 Client를 찾아서 정보를 채워야 함
            Client client = clientRepo.findByClient_id(repeat.getClient_id());

            // 4. Schedule 객체 생성 (빌더 패턴)
            Schedule newSchedule = Schedule.builder()
                    .client_id(repeat.getClient_id())
                    .schedule_name(repeat.getSchedule_name())
                    .location(repeat.getLocation())
                    .memo(repeat.getMemo())
                    .stress_tag(repeat.getStress_tag())
                    .controllable(repeat.getControllable())

                    // ★ 핵심: 위에서 만든 '오늘 날짜 시간'을 넣음
                    .start_time(newStartTime)
                    .end_time(newEndTime)

                    // 알림 시간 계산 (null 처리 주의)
                    .notification_time(repeat.getNotification_time() != null ?
                            repeat.getNotification_time() : null)
                    .build();

            // 5. 저장
            scheduleRepo.save(newSchedule);
            notificationTaskService.register(newSchedule);
        }
    }


    public void deleteRepeat_schedule() {
        repeatScheduleRepo.deleteByRepeat_end_date(LocalDate.now());
    }


    public List<StressRes.StressSummaryInfo> summaryStress(LocalDateTime startTime, LocalDateTime endTime, Long myId) {
            //상황에 따라 다르게(checkStress)
        LocalTime start = LocalTime.of(0, 0, 0, 0);
        LocalTime end = LocalTime.MAX;
        List<ScheduleRes.ScheduleAll> schedules = getSchedule(LocalDateTime.of(startTime.toLocalDate(), start),LocalDateTime.of(endTime.toLocalDate(), end),myId);
        // 날짜별 누적 스트레스 저장할 Map
        Map<LocalDate, Integer> dateToStress = new HashMap<>();

        for (ScheduleRes.ScheduleAll schedule : schedules) {

            LocalDate startDate = schedule.getStart_time().toLocalDate();
            LocalDate endDate = schedule.getEnd_time().toLocalDate();
            int stress = schedule.getStress_tag(); // 스트레스 값

            // start~end 까지 날짜 반복
            LocalDate date = startDate;
            while (!date.isAfter(endDate)) {
                dateToStress.put(date, dateToStress.getOrDefault(date, 0) + stress);
                date = date.plusDays(1);
            }
        }

        // Map → List<StressSummaryInfo>
        List<StressRes.StressSummaryInfo> result = dateToStress.entrySet().stream()
                .map(entry -> StressRes.StressSummaryInfo.builder()
                        .date(entry.getKey())
                        .total_stress(entry.getValue())
                        .build()
                )
                .sorted(Comparator.comparing(StressRes.StressSummaryInfo::getDate)) // 날짜 순 정렬
                .collect(Collectors.toList());

        return result;
    }


    public Integer checkStress(LocalDate date, Long myId){
        if(date.isAfter(LocalDate.now())){
            return scheduleRepo.sumStressByDate(date.atStartOfDay(), date.plusDays(1).atStartOfDay(), myId);
        }
        else {
            return scheduleRepo.sumStressByDate(date.atStartOfDay(), date.plusDays(1).atStartOfDay(), myId)
                    +repeatScheduleRepo.sumStressByDateWithRepeat(date.getDayOfWeek(), date, myId);
        }
    }

    public ScheduleRes.error findConflict(Long schedule_id, LocalDateTime start_time,LocalDateTime end_time,Integer stress_tag,Long myId){
        List<ScheduleRes.ScheduleAll> contextSchedules = getSchedule(
                start_time, end_time, myId);
        contextSchedules.removeIf(element -> element.getSchedule_id().equals(schedule_id));
        List<StressRes.StressSummaryInfo> stressSummarys =summaryStress(start_time, end_time, myId);
        LocalDate current =  start_time.toLocalDate();
        //중복 확인
        if(!contextSchedules.isEmpty()) {
            ScheduleRes.error err = ScheduleRes.error.builder()
                    .err(406)
                    .build();
            return err;
        }
        //스트레스 확인
        for(StressRes.StressSummaryInfo stressSummary : stressSummarys) {
            if(clientRepo.findByClient_id(myId).getClient_maxStress() < stressSummary.getTotal_stress()) {
                ScheduleRes.error err = ScheduleRes.error.builder()
                        .err(408)
                        .mess_date(stressSummary.getDate())
                        .build();
                return err;
            }
        }

//        LocalDate current =  start_time.toLocalDate();
//        while(current.isBefore(end_time.toLocalDate())||current.isEqual(end_time.toLocalDate())) {
//            if(!scheduleRepo.findByStartTimeBetweenAndClient_id(start_time,end_time,myId).isEmpty()) {
//                ScheduleRes.error err = ScheduleRes.error.builder()
//                        .err(406)
//                        .mess_date(current)
//                        .build();
//                return err;
//            }
//            else if(clientRepo.findByClient_id(myId).getClient_maxStress() < checkStress(current,myId)){
//                ScheduleRes.error err = ScheduleRes.error.builder()
//                        .err(408)
//                        .mess_date(current)
//                        .build();
//                return err;
//            }
//            current = current.plusDays(1);
//        }
//        {
            ScheduleRes.error err = ScheduleRes.error.builder()
                    .err(200)
                    .build();
            return err;
        }
//    }


    public Integer deleteByClient_id(Long clientId) {
        scheduleRepo.deleteByClient_id(clientId);
        repeatScheduleRepo.deleteByClient_id(clientId);
        return 0;
    }

    public ScheduleRes.ScheduleAll getScheduleByScheduleId(Long scheduleId) {
        return scheduleRepo.findByScheduleId(scheduleId);
    }
}
