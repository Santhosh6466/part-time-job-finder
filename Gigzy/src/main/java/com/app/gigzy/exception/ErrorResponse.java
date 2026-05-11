package com.app.gigzy.exception;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ErrorResponse {

    private boolean success;
    private ErrorDetails error;
    private LocalDateTime timestamp;

    @Data
    @AllArgsConstructor
    public static class ErrorDetails {
        private String code;
        private String message;
    }
}