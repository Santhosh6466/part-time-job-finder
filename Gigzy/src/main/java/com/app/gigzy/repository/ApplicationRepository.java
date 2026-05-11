package com.app.gigzy.repository;

import com.app.gigzy.model.Application;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ApplicationRepository extends MongoRepository<Application, String> {

    // 🔥 Get all applications for a provider
    List<Application> findByProviderEmail(String providerEmail);

    // 🔥 Get all applications by a seeker
    List<Application> findBySeekerEmail(String seekerEmail);

    // 🔥 Prevent duplicate apply
    boolean existsByJobIdAndSeekerEmail(String jobId, String seekerEmail);
}