package com.worke.server.workebackend.repo;

import com.worke.server.workebackend.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientRepo extends JpaRepository<Client, Integer> {

    @Query("SELECT c FROM Client c WHERE c.client_email = :email")
    Optional<Client> findByClient_email(String email);

    @Query("SELECT c FROM Client c WHERE c.client_id = :id")
    Client findByClient_id(Long id);
}
