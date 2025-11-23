package com.worke.server.workebackend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

public class ClientReq {
    @Builder
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @ToString
    public static class ClientInfo{
        @JsonProperty("client_name")
        private String client_name;
        @JsonProperty("client_email")
        private String client_email;
        @JsonProperty("client_maxStress")
        private Integer client_maxStress;
    }

    @Builder
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @ToString
    public static class ClientControllable{
        @JsonProperty("client_name")
        private String client_name;
        @JsonProperty("client_maxStress")
        private Integer client_maxStress;
    }
}
