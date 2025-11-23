package com.worke.server.workebackend.controller;

import com.worke.server.workebackend.dto.ClientReq;
import com.worke.server.workebackend.dto.ClientRes;
import com.worke.server.workebackend.dto.SessionUser;
import com.worke.server.workebackend.entity.Client;
import com.worke.server.workebackend.entity.Schedule;
import com.worke.server.workebackend.service.ClientService;
import com.worke.server.workebackend.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.context.SecurityContextHolder;

@Slf4j
@RestController
@RequestMapping("/client")
@RequiredArgsConstructor
public class ClientController {
    private final ClientService clientService;
    private final ScheduleService scheduleService;

    @PostMapping("/signUp")
    public ResponseEntity<?> signUp(@RequestBody ClientReq.ClientInfo clientInfo) {
        try {
            log.info("회원가입 요청 데이터 확인: " + clientInfo.toString());
        Integer check = clientService.save(clientInfo);
        if (check == 1)return  ResponseEntity.ok("회원가입 함수 문제");
        else return ResponseEntity.ok(200);
        }catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyInfo(@AuthenticationPrincipal OAuth2User oAuth2User) {
        try {
            // 1. 우리가 만든 'ID만 든 객체'가 맞는지 확인
            if (oAuth2User instanceof SessionUser) {
                SessionUser sessionUser = (SessionUser) oAuth2User;

                Long myId = sessionUser.getClient_id(); // ID 꺼내기

                Client client = clientService.findById(myId);
                if(client == null) ResponseEntity.status(401).body("정회원이 아닙니다. 회원가입 해주세요.");

                ClientRes.ClientAll clientRes = ClientRes.ClientAll.builder()
                        .client_name(client.getClient_name())
                        .client_email(client.getClient_email())
                        .client_maxStress(client.getClient_maxStress())
                        .build();
                return ResponseEntity.ok(clientRes);
            }

            // 2. 만약 SessionUser가 아니라면? -> 구글 정보(OAuth2User)가 들어있다는 뜻 -> 가입 안 한 사람
            return ResponseEntity.status(401).body("정회원이 아닙니다. 회원가입 해주세요.");
        }catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    @PatchMapping("/me/settings")
    public ResponseEntity<?> updateClient(@AuthenticationPrincipal OAuth2User oAuth2User,
                                          @RequestBody ClientReq.ClientControllable req) {
        try {
            //id 확인
            if (oAuth2User instanceof SessionUser) {
                SessionUser sessionUser = (SessionUser) oAuth2User;

                Long myId = sessionUser.getClient_id();

                Client client = clientService.findById(myId);
                Integer check = clientService.updateClient(client, req);
                if (check == 1) {
                    return ResponseEntity.status(500).body("회원정보 불러오기에 실패했습니다.");
                }
                return ResponseEntity.ok(200);
            }

            return ResponseEntity.status(401).body("정회원이 아닙니다. 회원가입 해주세요.");
        }catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteClient(
            @AuthenticationPrincipal OAuth2User oAuth2User,
            HttpServletRequest request
    ) {
        // 1. 로그인 안 된 상태거나, SessionUser 타입이 아닌 경우 (신규회원 상태 등) 차단
        if (!(oAuth2User instanceof SessionUser)) {
            return ResponseEntity.status(401).body("로그인이 필요하거나 올바르지 않은 사용자입니다.");
        }

        try {
            // 2. 형변환 후 ID(Long) 바로 꺼내기 (★ 핵심 수정 부분)
            SessionUser sessionUser = (SessionUser) oAuth2User;
            Long clientId = sessionUser.getClient_id();

            // 3. 서비스 호출 (Service 메서드도 매개변수를 Long으로 받도록 맞춰주세요)
            // clientService.deletById(String) -> clientService.deleteById(Long)
            Integer check = clientService.deleteById(clientId);

            if (check == 1) {
                return ResponseEntity.status(500).body("존재하지 않는 회원입니다.");
            }

            //3-1 사용자 관련된 일정 스키마들 삭제
            check = scheduleService.deleteByClient_id(clientId);

            if (check == 1) {
                return ResponseEntity.status(500).body("존재하지 않는 회원입니다.");
            }

            // 4. 세션 및 컨텍스트 삭제 (완벽합니다!)
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            SecurityContextHolder.clearContext();

            return ResponseEntity.ok("회원 탈퇴 완료");

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }
}
