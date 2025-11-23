package com.worke.server.workebackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worke.server.workebackend.dto.AiDto;
import com.worke.server.workebackend.dto.ScheduleRes;
import com.worke.server.workebackend.entity.Schedule;
import com.worke.server.workebackend.repo.ScheduleRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final ScheduleRepo scheduleRepo;
    private final ScheduleService scheduleService; // 반복 일정 로직 재사용
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.model}")
    private String model;

    @Transactional(readOnly = true)
    public AiDto.RecommendDate getRearrangedSchedule(Long scheduleId, Integer err) {
        log.info("🤖 AI 일정 재배치 시작 - Schedule ID: {}, Err: {}", scheduleId, err);

        // 1. 타겟 일정 조회 (NPE 방지를 위해 Optional 처리)
        Schedule targetSchedule = scheduleRepo.findBySchedule_id(scheduleId);

        log.info("✅ 타겟 일정 조회 성공: {}", targetSchedule.getSchedule_name());

        // 2. 주변 일정 조회 (ScheduleService 이용 -> 반복 일정 포함됨)
        // 범위: 타겟 앞뒤 3일 (총 7일)
        LocalDateTime rangeStart = targetSchedule.getStart_time().minusDays(3);
        LocalDateTime rangeEnd = targetSchedule.getEnd_time().plusDays(3);

        List<ScheduleRes.ScheduleAll> contextSchedules = scheduleService.getSchedule(
                rangeStart, rangeEnd, targetSchedule.getClient_id()
        );

        // ★ 중요: AI에게 보내는 리스트에서 '타겟 일정(현재 옮기려는 애)'은 빼야 합니다.
        // (AI가 "이미 그 시간에 일정이 있는데요?" 하고 자기 자신과 충돌내는 것을 방지)
        contextSchedules.removeIf(s -> s.getSchedule_id().equals(scheduleId));

        log.info("✅ 주변 일정(반복포함) {}개 로드 완료 (기간: {} ~ {})", contextSchedules.size(), rangeStart, rangeEnd);

        // 3. 프롬프트 선택 및 작성
        String systemPrompt = createSystemPrompt();
        String userPrompt;

        if (err == 406) { // Case 1: 겹침, Break 필요
            userPrompt = createUserPromptForBreak(targetSchedule, contextSchedules, rangeStart, rangeEnd);
        } else { // Case 2: Stress 과부하 (그 외)
            userPrompt = createUserPromptForStress(targetSchedule, contextSchedules, rangeStart, rangeEnd);
        }

        // 4. OpenAI API 호출
        String aiResponse = callOpenAi(systemPrompt, userPrompt);

        // 5. 응답 파싱
        return parseResponse(aiResponse);
    }

    // --- OpenAI 통신 로직 ---

    private String callOpenAi(String systemPrompt, String userPrompt) {
        String url = "https://api.openai.com/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        List<AiDto.Message> messages = new ArrayList<>();
        messages.add(new AiDto.Message("system", systemPrompt));
        messages.add(new AiDto.Message("user", userPrompt));

        // temperature 0.5: 조금 더 논리적이고 안정적인 판단 유도
        AiDto.ChatRequest request = new AiDto.ChatRequest(model, messages, 0.5);
        HttpEntity<AiDto.ChatRequest> entity = new HttpEntity<>(request, headers);

        try {
            log.info("🚀 OpenAI API 요청 전송...");
            ResponseEntity<AiDto.ChatResponse> response = restTemplate.postForEntity(url, entity, AiDto.ChatResponse.class);

            if (response.getBody() == null || response.getBody().getChoices().isEmpty()) {
                throw new RuntimeException("OpenAI 응답이 비어있습니다.");
            }

            String content = response.getBody().getChoices().get(0).getMessage().getContent();
            log.info("📩 OpenAI 응답 수신: {}", content);
            return content;

        } catch (HttpClientErrorException e) {
            log.error("🚨 OpenAI API 오류: {} / {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("OpenAI API 오류: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("🚨 AI 서비스 내부 오류", e);
            throw new RuntimeException("AI 서비스 처리 중 오류 발생");
        }
    }

    private AiDto.RecommendDate parseResponse(String jsonResponse) {
        try {
            // Markdown 코드 블럭 제거 (```json ... ```)
            String cleanedJson = jsonResponse.replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();
            return objectMapper.readValue(cleanedJson, AiDto.RecommendDate.class);
        } catch (Exception e) {
            log.error("🚨 JSON 파싱 실패: {}", jsonResponse, e);
            throw new RuntimeException("AI 응답 형식이 올바르지 않습니다.");
        }
    }

    // --- 헬퍼 메서드: 일별 스트레스 합계 계산 ---
    private String getDailyStressSummary(List<ScheduleRes.ScheduleAll> schedules) {
        Map<LocalDate, Integer> stressMap = schedules.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getStart_time().toLocalDate(),
                        Collectors.summingInt(ScheduleRes.ScheduleAll::getStress_tag)
                ));

        if (stressMap.isEmpty()) {
            return "No other schedules.";
        }

        return stressMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> String.format("- %s : Total Stress %d", entry.getKey(), entry.getValue()))
                .collect(Collectors.joining("\n"));
    }

    // --- 프롬프트 생성 로직 ---

    private String createSystemPrompt() {
        return """
            You are a professional scheduling assistant.
            Your task is to find the BEST time slot based on the user's request.
            
            [GLOBAL CONSTRAINTS]
            1. EXCLUDE Sleep Time: 23:00 ~ 07:00
            2. EXCLUDE Meal Time: 12:00 ~ 13:00, 18:00 ~ 19:00
            3. Must maintain at least a 10-minute gap between schedules.
            4. The recommended time MUST be strictly within the provided 'SCHEDULE CONTEXT RANGE'.
            
            [OUTPUT FORMAT]
            Return ONLY a valid JSON object. No markdown, no explanations.
            Format:
            {
                "schedule_id": <Long ID of the event to be moved>,
                "start_time": "YYYY-MM-DDTHH:mm:ss",
                "end_time": "YYYY-MM-DDTHH:mm:ss"
            }
            """;
    }

    // CASE 1: Break 필요 / 일정 겹침 (406)
    private String createUserPromptForBreak(Schedule target, List<ScheduleRes.ScheduleAll> others, LocalDateTime rangeStart, LocalDateTime rangeEnd) {
        // [핵심] Start와 End를 명시적으로 적어주어 AI가 날짜를 헷갈리지 않게 함
        String scheduleListStr = others.stream()
                .map(s -> String.format("- ID:%d | Start: %s | End: %s",
                        s.getSchedule_id(), s.getStart_time(), s.getEnd_time()))
                .collect(Collectors.joining("\n"));

        String dailyStressSummary = getDailyStressSummary(others);

        return String.format("""
            [TASK]
            Re-schedule the 'Target Event' to avoid conflict.
            
            [TARGET EVENT INFO]
            - ID: %d
            - Name: %s
            - Duration: %d minutes
            
            [SCHEDULE CONTEXT RANGE]
            %s ~ %s
            
            [DAILY STRESS REPORT (Reference for Priority 1)]
            %s
            
            [EXISTING SCHEDULES (OCCUPIED SLOTS - DO NOT OVERLAP)]
            %s
            
            [PRIORITY LOGIC]
            1. MAIN CRITICAL : The duration of the newly recommended schedule must be exactly the same as the original schedule.
            (i.e., New EndTime - New StartTime == Original EndTime - Original StartTime)
            2. CRITICAL : Must maintain at least a !10-minute gap! from any existing schedule.
            (e.g., If existing schedule is 12-09 01:27 ~ 12-31 12:31, your recommendation must end by <= 12-09 01:07 OR start after >= 12-31 12:41)
            3. CRITICAL : The new slot must NOT overlap with any 'Existing Schedules'.
            (Pay attention to Multi-Day events! e.g., Start: 12-09 | End: 12-31 means the whole period is blocked.)
            4. Priority 1: As close to START time (%s) or END time (%s) as possible.
            5. Priority 2: Minimize daily total stress. (Refer to [DAILY STRESS REPORT]. Pick a day with low stress.)
            6. STRICTLY follow Sleep/Meal time exclusions.
            
            Calculate the best 'start_time' and 'end_time' for Target Event (ID: %d).
            """,
                target.getSchedule_id(),
                target.getSchedule_name(),
                java.time.Duration.between(target.getStart_time(), target.getEnd_time()).toMinutes(),
                rangeStart, rangeEnd,
                dailyStressSummary,
                scheduleListStr,
                rangeStart, rangeEnd,
                target.getSchedule_id()
        );
    }

    // CASE 2: Total Stress 과부하 (그 외)
    private String createUserPromptForStress(Schedule target, List<ScheduleRes.ScheduleAll> others, LocalDateTime rangeStart, LocalDateTime rangeEnd) {
        // [핵심] Start/End 명시 및 기타 속성 포함
        String scheduleListStr = others.stream()
                .map(s -> String.format("- ID:%d | Start: %s | End: %s | Controllable:%b | Stress:%d",
                        s.getSchedule_id(), s.getStart_time(), s.getEnd_time(),
                        s.getControllable(), s.getStress_tag()))
                .collect(Collectors.joining("\n"));

        String dailyStressSummary = getDailyStressSummary(others);

        return String.format("""
            [TASK]
            Resolve 'Total Stress' overload. Move an event to a non-overlapping slot.
            
            [TARGET EVENT INFO]
            - ID: %d
            - Name: %s
            - Controllable: %b
            - Duration: %d minutes
            
            [SCHEDULE CONTEXT RANGE]
            %s ~ %s
            
            [DAILY STRESS REPORT (Reference for Priority 1)]
            %s
            (Higher value means the day is busier/more stressful. Try to avoid these days.)
            
            [EXISTING SCHEDULES (OCCUPIED SLOTS)]
            %s
            
            [LOGIC STEP 1: Select Event to Move]
            - If Target is CONTROLLABLE: Move Target (ID: %d).
            - If Target is NOT CONTROLLABLE: Pick a 'Victim' from Existing Schedules.
              (Selection Criteria: Must be Controllable=true > Priority to Non-Repeating > Priority to Higher Stress)
            
            [LOGIC STEP 2: Find New Slot]
            1. CRITICAL : The new slot must NOT overlap with any other schedules.
               (Pay attention to Multi-Day events! They block the entire duration.)
            2. CRITICAL : Must maintain 10min gap.
            3. CRITICAL : The duration of the newly recommended schedule must be exactly the same as the original schedule.
            (i.e., New EndTime - New StartTime == Original EndTime - Original StartTime)
            4. Priority 1: Minimize daily total stress. (Refer to [DAILY STRESS REPORT]. Pick a day with low stress.)
            5. Priority 2: As close to START time (%s) or END time (%s) as possible.
            6. STRICTLY follow Sleep/Meal time exclusions.
            
            Return JSON with 'schedule_id', 'start_time', 'end_time'.
            """,
                target.getSchedule_id(),
                target.getSchedule_name(),
                target.getControllable(),
                java.time.Duration.between(target.getStart_time(), target.getEnd_time()).toMinutes(),
                rangeStart, rangeEnd,
                dailyStressSummary,
                scheduleListStr,
                target.getSchedule_id(),
                rangeStart, rangeEnd
        );
    }
}