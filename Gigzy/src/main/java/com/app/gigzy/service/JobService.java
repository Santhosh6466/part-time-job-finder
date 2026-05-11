package com.app.gigzy.service;

import com.app.gigzy.model.Job;
import com.app.gigzy.repository.JobRepository;
import com.app.gigzy.enums.Category;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    // 🔥 CREATE JOB (Provider)
    public Job createJob(Job job, String email) {

        job.setCreatedBy(email); // from JWT
        return jobRepository.save(job);
    }

    // 🔥 GET ALL JOBS (Seeker)
    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    // 🔥 GET JOBS BY PROVIDER
    public List<Job> getJobsByProvider(String email) {
        return jobRepository.findByCreatedBy(email);
    }

    // 🔥 GET JOBS BY CATEGORY
    public List<Job> getJobsByCategory(Category category) {
        return jobRepository.findByCategory(category);
    }
}