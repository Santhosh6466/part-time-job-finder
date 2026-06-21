package com.app.gigzy.service;

import com.app.gigzy.enums.JobStatus;
import com.app.gigzy.exception.CustomException;
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

    // CREATE JOB (Provider)
    public Job createJob(Job job, String email) {

        job.setCreatedBy(email); // from JWT
        job.setStatus(JobStatus.OPEN);
        return jobRepository.save(job);
    }

    // GET ALL JOBS (Seeker)
    public List<Job> getAllJobs() {
        return jobRepository.findAll()
                .stream()
                .filter(job -> job.getStatus() == JobStatus.OPEN)
                .toList();
    }

    // GET JOBS BY PROVIDER
    public List<Job> getJobsByProvider(String email) {
        return jobRepository.findByCreatedBy(email);
    }

    // GET JOBS BY CATEGORY
    public List<Job> getJobsByCategory(Category category) {
        return jobRepository.findByCategory(category);
    }

    //  SEARCH JOBS
    public List<Job> searchJobs(String keyword) {

        return jobRepository.searchJobs(keyword);
    }

    //  FILTER BY LOCATION
    public List<Job> getJobsByLocation(String location) {

        return jobRepository.findByLocationIgnoreCase(location);
    }

    // ✏️ EDIT JOB
    public Job updateJob(String jobId, Job updatedJob, String providerEmail) {

        Job existingJob = jobRepository.findById(jobId)
                .orElseThrow(() -> new CustomException(
                        "JOB_NOT_FOUND",
                        "Job not found"
                ));

        // 🔒 Only creator can edit
        if (!existingJob.getCreatedBy().equals(providerEmail)) {

            throw new CustomException(
                    "UNAUTHORIZED_JOB_ACCESS",
                    "You are not allowed to edit this job"
            );
        }

        existingJob.setTitle(updatedJob.getTitle());
        existingJob.setDescription(updatedJob.getDescription());
        existingJob.setLocation(updatedJob.getLocation());
        existingJob.setBudget(updatedJob.getBudget());
        existingJob.setCategory(updatedJob.getCategory());
        existingJob.setSkillsRequired(updatedJob.getSkillsRequired());

        return jobRepository.save(existingJob);
    }

    // 🗑️ DELETE JOB
    public void deleteJob(String jobId, String providerEmail) {

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new CustomException(
                        "JOB_NOT_FOUND",
                        "Job not found"
                ));

        // 🔒 Only creator can delete
        if (!job.getCreatedBy().equals(providerEmail)) {

            throw new CustomException(
                    "UNAUTHORIZED_JOB_ACCESS",
                    "You are not allowed to delete this job"
            );
        }

        jobRepository.delete(job);
    }

    // 🔄 UPDATE JOB STATUS
    public Job updateJobStatus(String jobId,
                               JobStatus status,
                               String providerEmail) {

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new CustomException(
                        "JOB_NOT_FOUND",
                        "Job not found"
                ));

        // 🔒 Only the creator can update the status
        if (!job.getCreatedBy().equals(providerEmail)) {
            throw new CustomException(
                    "UNAUTHORIZED_JOB_ACCESS",
                    "You are not allowed to update this job"
            );
        }

        job.setStatus(status);

        return jobRepository.save(job);
    }
}