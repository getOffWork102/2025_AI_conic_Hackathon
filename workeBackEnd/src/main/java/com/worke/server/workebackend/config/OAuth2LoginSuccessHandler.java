package com.worke.server.workebackend.config;

import com.worke.server.workebackend.entity.Client;
import com.worke.server.workebackend.repo.ClientRepo;
import com.worke.server.workebackend.dto.SessionUser;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final ClientRepo clientRepo;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException, ServletException {

        log.info("OAuth2 로그인 성공! DB 사용자 확인 시작...");

        String email = null;

        // 1) 기존 회원이면 SessionUser로 로그인되며, email이 없음 → DB에서 다시 조회
        if (authentication.getPrincipal() instanceof SessionUser sessionUser) {
            Long id = sessionUser.getId();
            log.info("SessionUser 감지됨. ID로 DB에서 이메일 조회: {}", id);

            Client client = clientRepo.findByClient_id(id);
            if (client != null) {
                email = client.getClient_email();
                log.info("DB에서 가져온 이메일: {}", email);
            } else {
                log.error("SessionUser ID가 DB에 존재하지 않음! 강제로 회원가입으로 이동");
                response.sendRedirect("http://localhost:3000/signup");
                return;
            }

        } else {
            // 2) 신규 회원이면 OAuth2User 그대로 들어옴 → 구글 이메일 사용
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            email = oAuth2User.getAttribute("email");
            log.info("OAuth2User 감지됨. 구글에서 받은 이메일: {}", email);
        }

        // 3) DB에서 최종 체크
        Optional<Client> clientOptional = clientRepo.findByClient_email(email);

        if (clientOptional.isPresent()) {
            // 기존 회원 → 홈 이동
            log.info("기존 회원입니다. 홈으로 이동합니다.");
            response.sendRedirect("http://localhost:3000/home");
        } else {
            // 신규 회원 → 회원가입 페이지 이동
            log.info("신규 회원입니다. 회원가입 페이지로 이동합니다.");
            response.sendRedirect("http://localhost:3000/signup?client_email=" + email);
        }
    }
}