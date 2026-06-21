package com.app.gigzy.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProviderDashboardResponse {

    private long jobsPosted;
    private long openJobs;
    private long closedJobs;
    private long filledJobs;

    private long totalApplications;
    private long acceptedApplications;
    private long pendingApplications;
    private long rejectedApplications;
}