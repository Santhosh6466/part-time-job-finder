package com.app.gigzy.controller;

import com.app.gigzy.dto.ProviderProfileRequest;
import com.app.gigzy.dto.SeekerProfileRequest;
import com.app.gigzy.dto.UploadResponse;
import com.app.gigzy.model.ProviderProfile;
import com.app.gigzy.model.SeekerProfile;
import com.app.gigzy.service.CloudinaryService;
import com.app.gigzy.service.ProviderProfileService;
import com.app.gigzy.service.SeekerProfileService;


import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;


@RestController
@RequestMapping("/seeker")
public class SeekerProfileController {

    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private SeekerProfileService seekerProfileService;

    @Autowired
    private ProviderProfileService providerProfileService;



    @Autowired
    private ObjectMapper objectMapper;

    @PostMapping(
            value = "/profile",
            consumes = "multipart/form-data"
    )
    public SeekerProfile saveProfile(

            @RequestPart("profile") String profileJson,

            @RequestPart(value = "image", required = false)
            MultipartFile image,

            Authentication authentication
    ) throws Exception {

        SeekerProfileRequest request =
                objectMapper.readValue(
                        profileJson,
                        SeekerProfileRequest.class
                );

        String email = authentication.getName();

        SeekerProfile existingProfile = null;

        try {
            existingProfile = seekerProfileService.getProfile(email);
        } catch (Exception ignored) {
        }

        String imageUrl = null;
        String publicId = null;

        if (image != null && !image.isEmpty()) {

            if (existingProfile != null &&
                    existingProfile.getProfileImagePublicId() != null) {

                cloudinaryService.deleteImage(
                        existingProfile.getProfileImagePublicId()
                );
            }

            UploadResponse upload = cloudinaryService.uploadImage(image);

            imageUrl = upload.getImageUrl();
            publicId = upload.getPublicId();
        }

        return seekerProfileService.saveProfile(
                email,
                request,
                imageUrl,
                publicId
        );
    }

    // GET MY PROFILE
    @GetMapping("/profile")
    public SeekerProfile getProfile(Authentication authentication) {

        return seekerProfileService.getProfile(
                authentication.getName()
        );
    }

    // ✅ GET PROVIDER PROFILE BY EMAIL
    @GetMapping("/provider-profile/{email}")
    public ProviderProfile getProviderProfile(
            @PathVariable String email
    ) {

        return providerProfileService.getProfileByEmail(email);
    }

    @DeleteMapping("/profile/image")
    public void deleteProfileImage(Authentication authentication) {

        String email = authentication.getName();

        SeekerProfile profile = seekerProfileService.getProfile(email);

        if (profile.getProfileImagePublicId() != null) {

            cloudinaryService.deleteImage(profile.getProfileImagePublicId());

            profile.setProfileImageUrl(null);
            profile.setProfileImagePublicId(null);

            seekerProfileService.save(profile);
        }
    }
}