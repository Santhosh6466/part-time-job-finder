package com.app.gigzy.controller;

import com.app.gigzy.dto.*;
import com.app.gigzy.model.User;
import com.app.gigzy.service.AuthService;
import com.app.gigzy.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private OtpService otpService;

    // Send OTP
    @PostMapping("/send-otp")
    public String sendOtp(@Valid @RequestBody OtpRequest request) {
        otpService.sendOtp(request.getEmail());
        return "OTP sent successfully";
    }

    //Verify OTP
    @PostMapping("/verify-otp")
    public String verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {

        boolean valid = otpService.verifyOtp(
                request.getEmail(),
                request.getOtp()
        );

        if (valid) return "OTP verified";
        else throw new RuntimeException("Invalid OTP");
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

}