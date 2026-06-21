package com.app.gigzy.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeekerDashboardResponse {

    private long totalApplications;
    private long acceptedApplications;
    private long pendingApplications;
    private long rejectedApplications;
}