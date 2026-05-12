package com.app.gigzy.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class SeekerProfileRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    private List<String> skills;

    @NotBlank(message = "Experience is required")
    private String experience;

    @NotBlank(message = "Location is required")
    private String location;

    private String bio;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;
}