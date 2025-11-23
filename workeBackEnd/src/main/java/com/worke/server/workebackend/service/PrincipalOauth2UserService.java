package com.worke.server.workebackend.service;

import com.worke.server.workebackend.dto.SessionUser;
import com.worke.server.workebackend.entity.Client;
import com.worke.server.workebackend.repo.ClientRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class PrincipalOauth2UserService extends DefaultOAuth2UserService {

    private final ClientRepo clientRepo;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest oAuth2UserRequest) throws OAuth2AuthenticationException {
        // 1. 일단 구글이랑 통신해서 이메일은 알아냅니다.
        OAuth2User oAuth2User = super.loadUser(oAuth2UserRequest);
        String email = oAuth2User.getAttribute("email");

        // 2. DB 조회
        Optional<Client> clientOptional = clientRepo.findByClient_email(email);

        if (clientOptional.isPresent()) {
            // ★ [핵심] 가입된 회원이면 구글 정보(oAuth2User)는 갖다 버립니다.
            // 우리 DB ID만 담은 초경량 객체를 세션에 넣습니다.
            Long dbId = clientOptional.get().getId();
            log.info("기존 회원 로그인. ID만 세션에 저장: " + dbId);

            return new SessionUser(dbId);
        } else {
            // 신규 회원은 ID가 없으니까, 회원가입 전까지만 임시로 구글 정보를 씁니다.
            log.info("신규 회원. 이메일 전달용 임시 객체 사용.");
            return oAuth2User;
        }
    }
}