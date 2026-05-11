package com.app.gigzy.service;

import com.app.gigzy.exception.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(toEmail);
            helper.setSubject("Gigzy - OTP Verification");

            String htmlContent = """
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #2c3e50;">Gigzy Verification</h2>
                    
                    <p>Hello,</p>
                    
                    <p>Your OTP for verification is:</p>
                    
                    <div style="
                        font-size: 24px;
                        font-weight: bold;
                        letter-spacing: 3px;
                        background: #f4f4f4;
                        padding: 10px;
                        display: inline-block;
                        border-radius: 8px;
                        margin: 10px 0;
                    ">
                        """ + otp + """
                    </div>
                    
                    <p>This OTP is valid for <b>5 minutes</b>.</p>
                    
                    <p>If you didn’t request this, you can safely ignore this email.</p>
                    
                    <br/>
                    
                    <p style="color: gray; font-size: 12px;">
                        — Gigzy Team
                    </p>
                </div>
            """;

            helper.setText(htmlContent, true); // 🔥 HTML enabled

            mailSender.send(message);

        } catch (Exception e) {
            throw new CustomException(
                    "EMAIL_SEND_FAILED",
                    "Failed to send OTP email. Please try again later"
            );
        }
    }
}