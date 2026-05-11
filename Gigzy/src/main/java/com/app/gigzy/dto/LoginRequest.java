package com.app.gigzy.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
@Data

public class LoginRequest {

    @Email(message = "Enter a valid email")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}