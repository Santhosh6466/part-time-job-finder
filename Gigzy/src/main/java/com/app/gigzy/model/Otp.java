package com.app.gigzy.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "otp")
public class Otp {

    @Id
    private String id;

    private String email;
    private String otp;

    private LocalDateTime expiryTime;

    private boolean verified;
}