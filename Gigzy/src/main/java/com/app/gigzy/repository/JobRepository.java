package com.app.gigzy.repository;

import com.app.gigzy.model.Job;
import com.app.gigzy.enums.Category;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface JobRepository extends MongoRepository<Job, String> {

    // 🔥 Get jobs by provider
    List<Job> findByCreatedBy(String createdBy);

    // 🔥 Get jobs by category
    List<Job> findByCategory(Category category);

    // 🔥 Optional (future)
    List<Job> findByCategoryAndLocation(Category category, String location);
}