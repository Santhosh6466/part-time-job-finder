package com.app.gigzy.service;

import com.app.gigzy.dto.SeekerProfileRequest;
import com.app.gigzy.exception.CustomException;
import com.app.gigzy.model.SeekerProfile;
import com.app.gigzy.repository.SeekerProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class SeekerProfileService {

    @Autowired
    private SeekerProfileRepository repository;

    // 🔥 CREATE / UPDATE PROFILE
    public SeekerProfile saveProfile(String email, SeekerProfileRequest request) {

        SeekerProfile profile = repository.findByEmail(email)
                .orElse(new SeekerProfile());

        profile.setEmail(email);
        profile.setFullName(request.getFullName());
        profile.setSkills(request.getSkills());
        profile.setExperience(request.getExperience());
        profile.setLocation(request.getLocation());
        profile.setBio(request.getBio());
        profile.setPhoneNumber(request.getPhoneNumber());

        if (profile.getCreatedAt() == null) {
            profile.setCreatedAt(LocalDateTime.now());
        }

        return repository.save(profile);
    }

    // 🔥 GET PROFILE
    public SeekerProfile getProfile(String email) {

        return repository.findByEmail(email)
                .orElseThrow(() -> new CustomException(
                        "PROFILE_NOT_FOUND",
                        "Seeker profile not found"
                ));
    }
}