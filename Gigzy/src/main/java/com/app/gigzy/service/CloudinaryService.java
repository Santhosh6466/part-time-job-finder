package com.app.gigzy.service;

import com.app.gigzy.dto.UploadResponse;
import com.app.gigzy.exception.CustomException;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    public UploadResponse uploadImage(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new CustomException(
                    "IMAGE_NOT_FOUND",
                    "Please select an image to upload."
            );
        }

        try {

            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.emptyMap()
            );

            String imageUrl = uploadResult.get("secure_url").toString();
            String publicId = uploadResult.get("public_id").toString();

            return new UploadResponse(imageUrl, publicId);

        } catch (IOException e) {

            throw new CustomException(
                    "IMAGE_UPLOAD_FAILED",
                    "Failed to upload image. Please try again."
            );
        }
    }

    public void deleteImage(String publicId) {

        if (publicId == null || publicId.isBlank()) {
            return;
        }

        try {

            cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.emptyMap()
            );

        } catch (IOException e) {

            throw new CustomException(
                    "IMAGE_DELETE_FAILED",
                    "Failed to delete image."
            );
        }
    }
}