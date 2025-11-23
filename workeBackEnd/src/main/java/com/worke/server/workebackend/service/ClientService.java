package com.worke.server.workebackend.service;

import com.worke.server.workebackend.dto.ClientReq;
import com.worke.server.workebackend.entity.Client;
import com.worke.server.workebackend.repo.ClientRepo;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Getter
@Setter
public class ClientService {
    private final ClientRepo clientRepo;

    public ClientService(ClientRepo clientRepo) {
        this.clientRepo = clientRepo;
    }

    //signUp
    public Integer save(ClientReq.ClientInfo clientInfo){
        Client client = Client.builder()
                .client_name(clientInfo.getClient_name())
                .client_email(clientInfo.getClient_email())
                .client_maxStress(clientInfo.getClient_maxStress())
                .build();
        clientRepo.save(client);
        return 0;
    }

    //mypage user정보 반환
    public Client findById(Long client_id){
        Client client = clientRepo.findByClient_id(client_id);
        return client;
    }

    public Integer deleteById(Long client_id){
        // 1. DB에서 회원 삭제
        Client client = clientRepo.findByClient_id(client_id);
        if(client == null)
            return 1;
        clientRepo.delete(client); // DB 삭제 (JPA 기본 제공 메서드)

        return 0;
    }
    @Transactional
    public Integer updateClient(Client client, ClientReq.ClientControllable req) {
        client.updateNameAndMaxStress(req.getClient_name(),req.getClient_maxStress());
        return 0;
    }
}