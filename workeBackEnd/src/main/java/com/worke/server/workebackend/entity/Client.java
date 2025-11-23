package com.worke.server.workebackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class Client {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long client_id;
    @Column(nullable = false)
    private String client_name;

    @Column(nullable = false, unique = true)
    private String client_email;

    @Column(nullable = false)
    private Integer client_maxStress;
    

    public Long getId() {
        return client_id;
    }

    public void  updateNameAndMaxStress(String newName, Integer newMaxStress)
    {
        this.client_name= newName;
        this.client_maxStress = newMaxStress;
    }
}

