package com.hostel.module.student;

import com.hostel.shared.enums.StudentStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class StudentDtos {

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "First name is required")
        private String firstName;

        @NotBlank(message = "Last name is required")
        private String lastName;

        @NotBlank @Email(message = "Valid email required")
        private String email;

        private String phone;
        private String course;
        private String yearOfStudy;
        private String parentName;
        private String parentPhone;
        private String parentEmail;
        private String address;
        private LocalDate dateOfBirth;
        private String gender;
        private String bloodGroup;
        private String emergencyContact;
    }

    @Data
    public static class UpdateRequest {
        private String firstName;
        private String lastName;
        private String phone;
        private String course;
        private String yearOfStudy;
        private String parentName;
        private String parentPhone;
        private String parentEmail;
        private String address;
        private String bloodGroup;
        private String emergencyContact;
        private StudentStatus status;
    }

    @Data
    public static class Response {
        private Long id;
        private String studentId;
        private String firstName;
        private String lastName;
        private String fullName;
        private String email;
        private String phone;
        private String course;
        private String yearOfStudy;
        private String parentName;
        private String parentPhone;
        private String gender;
        private String bloodGroup;
        private StudentStatus status;
        private LocalDateTime createdAt;
        private String currentRoom;
    }
}
