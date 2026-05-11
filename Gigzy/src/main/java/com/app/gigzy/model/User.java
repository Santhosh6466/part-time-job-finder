package com.app.gigzy.model;
import com.app.gigzy.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {
    @Id
    private String id;
    @Indexed(unique = true)
    private String email;
    private String passwordHash;

    private Role role;

    // Profile fields
    private String name;
    private String phone;
    private String location;
    private List<String> skills;

    // Rating system
    @Builder.Default
    private double rating = 0.0;

    @Builder.Default
    private int totalRatings = 0;

    // Email verification
    @Builder.Default
    private boolean verified = false;

    // Account creation time
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();


}
