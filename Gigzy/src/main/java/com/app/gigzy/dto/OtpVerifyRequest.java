package com.app.gigzy.dto;

import lombok.Data;

@Data
public class OtpVerifyRequest {
    private String email;
    private String otp;
}