package com.app.gigzy.service;

import com.app.gigzy.exception.CustomException;
import com.app.gigzy.model.Otp;
import com.app.gigzy.repository.OtpRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OtpService {

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private EmailService emailService;

    // 🔹 Generate OTP
    public void sendOtp(String email) {

        // 🔥 clear previous OTPs
        otpRepository.deleteByEmail(email);

        String otp = String.valueOf(new Random().nextInt(900000) + 100000);

        Otp otpEntity = Otp.builder()
                .email(email)
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .verified(false)
                .build();

        otpRepository.save(otpEntity);

        emailService.sendOtpEmail(email, otp);
    }

    // 🔹 Verify OTP
    public boolean verifyOtp(String email, String otp) {

        Otp stored = otpRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(
                        "OTP_NOT_FOUND",
                        "No OTP found for this email"
                ));

        if (stored.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new CustomException(
                    "OTP_EXPIRED",
                    "OTP has expired. Please request a new one"
            );
        }

        if (!stored.getOtp().equals(otp)) {
            throw new CustomException(
                    "INVALID_OTP",
                    "The OTP you entered is incorrect"
            );
        }

        // 🔥 mark verified
        stored.setVerified(true);
        otpRepository.save(stored);

        return true;
    }

    // 🔹 Check verification
    public boolean isVerified(String email) {

        Otp stored = otpRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(
                        "OTP_NOT_FOUND",
                        "No OTP found for this email"
                ));

        return stored.isVerified();
    }
}