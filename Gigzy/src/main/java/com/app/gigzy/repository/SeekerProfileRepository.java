package com.app.gigzy.repository;

import com.app.gigzy.model.SeekerProfile;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface SeekerProfileRepository
        extends MongoRepository<SeekerProfile, String> {

    Optional<SeekerProfile> findByEmail(String email);
}