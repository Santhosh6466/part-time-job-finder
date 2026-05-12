package com.app.gigzy.repository;

import com.app.gigzy.model.ProviderProfile;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ProviderProfileRepository
        extends MongoRepository<ProviderProfile, String> {

    Optional<ProviderProfile> findByEmail(String email);
}