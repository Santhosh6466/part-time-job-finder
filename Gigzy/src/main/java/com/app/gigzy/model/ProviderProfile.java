package com.app.gigzy.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "provider_profiles")
public class ProviderProfile {

    @Id
    private String id;

    private String email;

    private String companyName;

    private String companyDescription;

    private String location;

    private String phoneNumber;

    private LocalDateTime createdAt;
}