package com.hostel.module.student;

import com.hostel.shared.enums.StudentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByStudentId(String studentId);
    Optional<Student> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Student> findByStatus(StudentStatus status);
    List<Student> findByStatusNot(StudentStatus status);

    @Query("SELECT s FROM Student s WHERE LOWER(s.firstName) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(s.lastName) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(s.studentId) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Student> search(String q);

    long countByStatus(StudentStatus status);
}
