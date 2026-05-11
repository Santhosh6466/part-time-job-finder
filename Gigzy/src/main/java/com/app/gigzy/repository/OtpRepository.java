package com.app.gigzy.repository;

import com.app.gigzy.model.Otp;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface OtpRepository extends MongoRepository<Otp, String> {

    Optional<Otp> findByEmail(String email);
    void deleteByEmail(String email);
}

