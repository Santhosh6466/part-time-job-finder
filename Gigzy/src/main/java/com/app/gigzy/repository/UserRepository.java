package com.app.gigzy.repository;

import com.app.gigzy.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface
UserRepository extends MongoRepository<User, String> {

    public Optional<User> findByEmail(String email);
    public boolean existsByEmail(String email);
}
