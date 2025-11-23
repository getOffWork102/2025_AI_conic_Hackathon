package com.worke.server.workebackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class ClientRes {
    @Builder
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClientAll{
        private String client_name;
        private String client_email;
        private Integer client_maxStress;
    }
}
