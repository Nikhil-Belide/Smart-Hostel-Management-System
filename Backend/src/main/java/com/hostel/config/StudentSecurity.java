package com.hostel.config;

import com.hostel.module.auth.AppUser;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("studentSecurity")
public class StudentSecurity {

    /**
     * Checks if the authenticated user is the owner of the given student record.
     */
    public boolean isOwner(Authentication authentication, Long studentId) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUser user)) {
            return false;
        }
        return user.getStudent() != null && user.getStudent().getId().equals(studentId);
    }
}
