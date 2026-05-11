package com.app.gigzy.model;

import com.app.gigzy.enums.Status;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "applications")
public class Application {

    @Id
    private String id;

    private String jobId;

    private String seekerEmail;

    private String providerEmail;

    private Status status;

    @Builder.Default
    private LocalDateTime appliedAt = LocalDateTime.now();
}