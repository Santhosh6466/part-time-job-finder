package com.app.gigzy.controller;

import com.app.gigzy.dto.ProviderDashboardResponse;
import com.app.gigzy.dto.SeekerDashboardResponse;
import com.app.gigzy.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    // =========================
    // PROVIDER DASHBOARD
    // =========================
    @GetMapping("/provider/dashboard")
    public ProviderDashboardResponse getProviderDashboard(
            Principal principal
    ) {

        return dashboardService.getProviderDashboard(
                principal.getName()
        );
    }

    // =========================
    // SEEKER DASHBOARD
    // =========================
    @GetMapping("/seeker/dashboard")
    public SeekerDashboardResponse getSeekerDashboard(
            Principal principal
    ) {

        return dashboardService.getSeekerDashboard(
                principal.getName()
        );
    }
}