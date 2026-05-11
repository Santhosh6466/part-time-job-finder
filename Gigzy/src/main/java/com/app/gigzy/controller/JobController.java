package com.app.gigzy.controller;

import com.app.gigzy.model.Job;
import com.app.gigzy.service.JobService;
import com.app.gigzy.enums.Category;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
public class JobController {

    @Autowired
    private JobService jobService;

    // 🔥 CREATE JOB (PROVIDER)
    @PostMapping("/provider/jobs")
    public Job createJob(@Valid @RequestBody Job job, Principal principal) {

        String email = principal.getName(); // from JWT
        return jobService.createJob(job, email);
    }

    // 🔥 GET PROVIDER JOBS
    @GetMapping("/provider/jobs")
    public List<Job> getMyJobs(Principal principal) {

        String email = principal.getName();
        return jobService.getJobsByProvider(email);
    }

    // 🔥 GET ALL JOBS (SEEKER)
    @GetMapping("/seeker/jobs")
    public List<Job> getAllJobs() {
        return jobService.getAllJobs();
    }

    // 🔥 GET JOBS BY CATEGORY
    @GetMapping("/seeker/jobs/category/{category}")
    public List<Job> getJobsByCategory(@PathVariable Category category) {
        return jobService.getJobsByCategory(category);
    }
}