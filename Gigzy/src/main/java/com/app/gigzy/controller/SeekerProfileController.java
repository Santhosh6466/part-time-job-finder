package com.app.gigzy.controller;

import com.app.gigzy.dto.SeekerProfileRequest;
import com.app.gigzy.model.SeekerProfile;
import com.app.gigzy.service.SeekerProfileService;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/seeker/profile")
public class SeekerProfileController {

    @Autowired
    private SeekerProfileService seekerProfileService;

    // 🔥 CREATE / UPDATE PROFILE
    @PostMapping
    public SeekerProfile saveProfile(
            @Valid @RequestBody SeekerProfileRequest request,
            Authentication authentication
    ) {

        String email = authentication.getName();

        return seekerProfileService.saveProfile(email, request);
    }

    // 🔥 GET PROFILE
    @GetMapping
    public SeekerProfile getProfile(Authentication authentication) {

        String email = authentication.getName();

        return seekerProfileService.getProfile(email);
    }
}