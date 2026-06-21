package com.app.gigzy.service;

import com.app.gigzy.dto.ProviderDashboardResponse;
import com.app.gigzy.dto.SeekerDashboardResponse;
import com.app.gigzy.enums.JobStatus;
import com.app.gigzy.enums.Status;
import com.app.gigzy.model.Application;
import com.app.gigzy.model.Job;
import com.app.gigzy.repository.ApplicationRepository;
import com.app.gigzy.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DashboardService {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    // =========================
    // PROVIDER DASHBOARD
    // =========================
    public ProviderDashboardResponse getProviderDashboard(String providerEmail) {

        List<Job> jobs = jobRepository.findByCreatedBy(providerEmail);

        long jobsPosted = jobs.size();

        long openJobs = jobs.stream()
                .filter(job -> job.getStatus() == JobStatus.OPEN)
                .count();

        long closedJobs = jobs.stream()
                .filter(job -> job.getStatus() == JobStatus.CLOSED)
                .count();

        long filledJobs = jobs.stream()
                .filter(job -> job.getStatus() == JobStatus.FILLED)
                .count();

        List<Application> applications =
                applicationRepository.findByProviderEmail(providerEmail);

        long totalApplications = applications.size();

        long acceptedApplications = applications.stream()
                .filter(a -> a.getStatus() == Status.ACCEPTED)
                .count();

        long pendingApplications = applications.stream()
                .filter(a -> a.getStatus() == Status.PENDING)
                .count();

        long rejectedApplications = applications.stream()
                .filter(a -> a.getStatus() == Status.REJECTED)
                .count();

        return ProviderDashboardResponse.builder()
                .jobsPosted(jobsPosted)
                .openJobs(openJobs)
                .closedJobs(closedJobs)
                .filledJobs(filledJobs)
                .totalApplications(totalApplications)
                .acceptedApplications(acceptedApplications)
                .pendingApplications(pendingApplications)
                .rejectedApplications(rejectedApplications)
                .build();
    }

    // =========================
    // SEEKER DASHBOARD
    // =========================
    public SeekerDashboardResponse getSeekerDashboard(String seekerEmail) {

        List<Application> applications =
                applicationRepository.findBySeekerEmail(seekerEmail);

        long totalApplications = applications.size();

        long acceptedApplications = applications.stream()
                .filter(a -> a.getStatus() == Status.ACCEPTED)
                .count();

        long pendingApplications = applications.stream()
                .filter(a -> a.getStatus() == Status.PENDING)
                .count();

        long rejectedApplications = applications.stream()
                .filter(a -> a.getStatus() == Status.REJECTED)
                .count();

        return SeekerDashboardResponse.builder()
                .totalApplications(totalApplications)
                .acceptedApplications(acceptedApplications)
                .pendingApplications(pendingApplications)
                .rejectedApplications(rejectedApplications)
                .build();
    }
}