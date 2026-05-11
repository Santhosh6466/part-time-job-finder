package com.app.gigzy.controller;

import com.app.gigzy.model.Application;
import com.app.gigzy.enums.Status;
import com.app.gigzy.service.ApplicationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    // 🔥 SEEKER → APPLY TO JOB
    @PostMapping("/seeker/apply/{jobId}")
    public Application applyToJob(@PathVariable String jobId, Principal principal) {

        String email = principal.getName();
        return applicationService.applyToJob(jobId, email);
    }

    // 🔥 PROVIDER → VIEW APPLICATIONS
    @GetMapping("/provider/applications")
    public List<Application> getApplicationsForProvider(Principal principal) {

        String email = principal.getName();
        return applicationService.getApplicationsForProvider(email);
    }

    // 🔥 SEEKER → VIEW THEIR APPLICATIONS
    @GetMapping("/seeker/applications")
    public List<Application> getApplicationsForSeeker(Principal principal) {

        String email = principal.getName();
        return applicationService.getApplicationsForSeeker(email);
    }

    // 🔥 PROVIDER → ACCEPT / REJECT
    @PutMapping("/provider/applications/{id}")
    public Application updateStatus(@PathVariable String id,
                                    @RequestParam Status status) {

        return applicationService.updateStatus(id, status);
    }
}