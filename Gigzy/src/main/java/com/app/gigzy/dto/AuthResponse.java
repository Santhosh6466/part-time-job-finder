package com.app.gigzy.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String email;
    private String name;
    private String message;
    private String token;
}