package com.app.gigzy.service;

import com.app.gigzy.exception.CustomException;
import com.app.gigzy.model.Application;
import com.app.gigzy.model.Job;
import com.app.gigzy.enums.Status;
import com.app.gigzy.repository.ApplicationRepository;
import com.app.gigzy.repository.JobRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private JobRepository jobRepository;

    // 🔥 APPLY TO JOB
    public Application applyToJob(String jobId, String seekerEmail) {

        // 🛑 Check if already applied
        if (applicationRepository.existsByJobIdAndSeekerEmail(jobId, seekerEmail)) {
            throw new CustomException(
                    "ALREADY_APPLIED",
                    "You have already applied to this job"
            );
        }

        // 🔍 Get job details
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new CustomException(
                        "JOB_NOT_FOUND",
                        "The requested job does not exist"
                ));

        // 🏗️ Create application
        Application application = Application.builder()
                .jobId(jobId)
                .seekerEmail(seekerEmail)
                .providerEmail(job.getCreatedBy())
                .status(Status.PENDING)
                .build();

        return applicationRepository.save(application);
    }

    // 🔥 PROVIDER → SEE APPLICATIONS
    public List<Application> getApplicationsForProvider(String providerEmail) {
        return applicationRepository.findByProviderEmail(providerEmail);
    }

    // 🔥 SEEKER → SEE THEIR APPLICATIONS
    public List<Application> getApplicationsForSeeker(String seekerEmail) {
        return applicationRepository.findBySeekerEmail(seekerEmail);
    }

    // 🔥 UPDATE STATUS (ACCEPT / REJECT)
    public Application updateStatus(String applicationId, Status status) {

        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new CustomException(
                        "APPLICATION_NOT_FOUND",
                        "Application not found"
                ));

        application.setStatus(status);

        return applicationRepository.save(application);
    }
}