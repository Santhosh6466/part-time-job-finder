package com.app.gigzy.model;

import com.app.gigzy.enums.Category;
import com.app.gigzy.enums.JobStatus;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "jobs")
public class Job {

    @Id
    private String id;

    private String title;
    private String description;
    private String location;
    private JobStatus status;

    private List<String> skillsRequired;

    private double budget;

    private Category category;

    private String createdBy;



    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}