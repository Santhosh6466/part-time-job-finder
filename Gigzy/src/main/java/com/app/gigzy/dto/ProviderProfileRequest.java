package com.app.gigzy.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProviderProfileRequest {

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Company description is required")
    private String companyDescription;

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;
}