package com.app.gigzy.controller;

import com.app.gigzy.enums.JobStatus;
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

    // 🔍 SEARCH JOBS
    @GetMapping("/seeker/jobs/search")
    public List<Job> searchJobs(
            @RequestParam String keyword
    ) {
        return jobService.searchJobs(keyword);
    }

    // 📍 FILTER JOBS BY LOCATION
    @GetMapping("/seeker/jobs/location/{location}")
    public List<Job> getJobsByLocation(
            @PathVariable String location
    ) {
        return jobService.getJobsByLocation(location);
    }

    @PutMapping("/provider/jobs/{jobId}/status")
    public Job updateJobStatus(
            @PathVariable String jobId,
            @RequestParam JobStatus status,
            Principal principal
    ) {

        return jobService.updateJobStatus(
                jobId,
                status,
                principal.getName()
        );
    }

    // ✏️ UPDATE JOB
    @PutMapping("/provider/jobs/{jobId}")
    public Job updateJob(
            @PathVariable String jobId,
            @Valid @RequestBody Job updatedJob,
            Principal principal
    ) {
        return jobService.updateJob(
                jobId,
                updatedJob,
                principal.getName()
        );
    }

    // 🗑 DELETE JOB
    @DeleteMapping("/provider/jobs/{jobId}")
    public void deleteJob(
            @PathVariable String jobId,
            Principal principal
    ) {
        jobService.deleteJob(
                jobId,
                principal.getName()
        );
    }




}