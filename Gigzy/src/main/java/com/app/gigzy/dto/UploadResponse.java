package com.app.gigzy.dto;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UploadResponse {

    String imageUrl;

    String publicId;
}
