package com.app.gigzy.controller;

import com.app.gigzy.dto.ProviderProfileRequest;
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
@RequestMapping("/provider/profile")
public class ProviderProfileController {

    @Autowired
    private ProviderProfileService providerProfileService;

    @Autowired
    private SeekerProfileService seekerProfileService;

    // 🔥 CREATE / UPDATE PROFILE
    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private ObjectMapper objectMapper;

    @PostMapping(
            consumes = "multipart/form-data"
    )
    public ProviderProfile saveProfile(

            @RequestPart("profile") String profileJson,

            @RequestPart(value = "image", required = false)
            MultipartFile image,

            Authentication authentication
    ) throws Exception {

        ProviderProfileRequest request =
                objectMapper.readValue(
                        profileJson,
                        ProviderProfileRequest.class
                );

        String email = authentication.getName();

        ProviderProfile existingProfile = null;

        try {
            existingProfile = providerProfileService.getProfile(email);
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

        return providerProfileService.saveProfile(
                email,
                request,
                imageUrl,
                publicId
        );
    }

    // 🔥 GET PROFILE
    @GetMapping
    public ProviderProfile getProfile(Authentication authentication) {

        String email = authentication.getName();

        return providerProfileService.getProfile(email);
    }

    @GetMapping("/seeker-profile/{email}")
    public SeekerProfile getSeekerProfile(
            @PathVariable String email
    ) {
        return seekerProfileService.getProfileByEmail(email);
    }

    @DeleteMapping("/image")
    public void deleteProfileImage(Authentication authentication) {

        String email = authentication.getName();

        ProviderProfile profile = providerProfileService.getProfile(email);

        if (profile.getProfileImagePublicId() != null) {

            cloudinaryService.deleteImage(profile.getProfileImagePublicId());

            profile.setProfileImageUrl(null);
            profile.setProfileImagePublicId(null);

            providerProfileService.save(profile);
        }
    }
}