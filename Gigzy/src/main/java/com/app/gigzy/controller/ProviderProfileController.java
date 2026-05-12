package com.app.gigzy.controller;

import com.app.gigzy.dto.ProviderProfileRequest;
import com.app.gigzy.model.ProviderProfile;
import com.app.gigzy.service.ProviderProfileService;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/provider/profile")
public class ProviderProfileController {

    @Autowired
    private ProviderProfileService providerProfileService;

    // 🔥 CREATE / UPDATE PROFILE
    @PostMapping
    public ProviderProfile saveProfile(
            @Valid @RequestBody ProviderProfileRequest request,
            Authentication authentication
    ) {

        String email = authentication.getName();

        return providerProfileService.saveProfile(email, request);
    }

    // 🔥 GET PROFILE
    @GetMapping
    public ProviderProfile getProfile(Authentication authentication) {

        String email = authentication.getName();

        return providerProfileService.getProfile(email);
    }
}