package com.app.gigzy.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "seeker_profiles")
public class SeekerProfile {

    @Id
    private String id;

    private String email;

    private String fullName;

    private List<String> skills;

    private String experience;

    private String location;

    private String bio;

    private String phoneNumber;

    private LocalDateTime createdAt;


    private String profileImageUrl;

    private String profileImagePublicId;
}