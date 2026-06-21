package com.app.gigzy.repository;

import com.app.gigzy.enums.Category;
import com.app.gigzy.model.Job;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface JobRepository extends MongoRepository<Job, String> {

    // 🔥 Get jobs by provider
    List<Job> findByCreatedBy(String createdBy);

    // 🔥 Get jobs by category
    List<Job> findByCategory(Category category);

    // 🔥 Optional
    List<Job> findByCategoryAndLocation(Category category, String location);

    // 📍 Filter by location
    List<Job> findByLocationIgnoreCase(String location);

    // 🔍 Search jobs
    @Query("""
    {
       $or: [
          { title: { $regex: ?0, $options: 'i' } },
          { description: { $regex: ?0, $options: 'i' } },
          { skillsRequired: { $regex: ?0, $options: 'i' } }
       ]
    }
    """)
    List<Job> searchJobs(String keyword);
}