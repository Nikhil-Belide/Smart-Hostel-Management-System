package com.hostel.module.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hostel.module.student.Student;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsername(String username);
    Optional<AppUser> findByStudent(Student student);
    boolean existsByUsername(String username);
}
