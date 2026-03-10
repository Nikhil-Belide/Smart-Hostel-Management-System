package com.hostel.module.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public class AuthDtos {

    @Data
    public static class LoginRequest {
        @NotBlank(message = "Username is required")
        private String username;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank private String currentPassword;
        @NotBlank private String newPassword;
    }

    @Data
    public static class TokenResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private String role;
        private String username;

        public TokenResponse(String accessToken, String refreshToken, String role, String username) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.role = role;
            this.username = username;
        }
    }
}
