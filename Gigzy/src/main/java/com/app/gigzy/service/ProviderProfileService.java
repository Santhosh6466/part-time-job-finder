package com.app.gigzy.service;

import com.app.gigzy.dto.ProviderProfileRequest;
import com.app.gigzy.exception.CustomException;
import com.app.gigzy.model.ProviderProfile;
import com.app.gigzy.repository.ProviderProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ProviderProfileService {

    @Autowired
    private ProviderProfileRepository repository;

    // 🔥 CREATE / UPDATE PROFILE
    // 🔥 CREATE / UPDATE PROFILE
    public ProviderProfile saveProfile(
            String email,
            ProviderProfileRequest request,
            String profileImageUrl,
            String profileImagePublicId
    ) {

        ProviderProfile profile = repository.findByEmail(email)
                .orElse(new ProviderProfile());

        profile.setEmail(email);
        profile.setCompanyName(request.getCompanyName());
        profile.setCompanyDescription(request.getCompanyDescription());
        profile.setLocation(request.getLocation());
        profile.setPhoneNumber(request.getPhoneNumber());

        // Update image only if a new image is uploaded
        if (profileImageUrl != null && !profileImageUrl.isBlank()) {
            profile.setProfileImageUrl(profileImageUrl);
            profile.setProfileImagePublicId(profileImagePublicId);
        }

        if (profile.getCreatedAt() == null) {
            profile.setCreatedAt(LocalDateTime.now());
        }

        return repository.save(profile);
    }

    // 🔥 GET PROFILE
    public ProviderProfile getProfile(String email) {

        return repository.findByEmail(email)
                .orElseThrow(() -> new CustomException(
                        "PROFILE_NOT_FOUND",
                        "Provider profile not found"
                ));
    }

    // 🏢 GET PROVIDER PROFILE BY EMAIL
    public ProviderProfile getProfileByEmail(String email) {

        return repository.findByEmail(email)
                .orElseThrow(() ->
                        new CustomException(
                                "PROFILE_NOT_FOUND",
                                "Provider profile not found"
                        ));
    }

    public ProviderProfile save(ProviderProfile profile) {
        return repository.save(profile);
    }
}