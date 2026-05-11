package com.app.gigzy.service;

import com.app.gigzy.auth.JwtUtil;
import com.app.gigzy.dto.AuthResponse;
import com.app.gigzy.dto.LoginRequest;
import com.app.gigzy.dto.RegisterRequest;
import com.app.gigzy.enums.Role;
import com.app.gigzy.exception.CustomException;
import com.app.gigzy.model.User;
import com.app.gigzy.repository.OtpRepository;
import com.app.gigzy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private OtpService otpService;

    @Autowired
    private OtpRepository otpRepository;

    public AuthResponse register(RegisterRequest request) {

        // 🔴 OTP check
        if (!otpService.isVerified(request.getEmail())) {
            throw new CustomException(
                    "OTP_NOT_VERIFIED",
                    "Please verify OTP before registering"
            );
        }

        // 🔴 Duplicate user check (VERY IMPORTANT)
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(
                    "USER_ALREADY_EXISTS",
                    "An account with this email already exists"
            );
        }

        // 🔴 Role validation
        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (Exception e) {
            throw new CustomException(
                    "INVALID_ROLE",
                    "Invalid role provided"
            );
        }

        // 🏗️ Create user
        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .verified(true)
                .build();

        userRepository.save(user);

        // 🔥 Delete OTP after success
        otpRepository.deleteByEmail(request.getEmail());

        return AuthResponse.builder()
                .email(user.getEmail())
                .name(user.getName())
                .message("User registered successfully")
                .build();
    }

    public AuthResponse login(LoginRequest request) {

        // 🔴 User not found
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException(
                        "USER_NOT_FOUND",
                        "No account found with this email"
                ));

        // 🔴 Password mismatch
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new CustomException(
                    "INVALID_PASSWORD",
                    "Incorrect password. Please try again"
            );
        }

        // 🔐 Generate JWT
        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        return AuthResponse.builder()
                .email(user.getEmail())
                .name(user.getName())
                .message("Login successful")
                .token(token)
                .build();
    }
}