package com.hostel.module.fee;

import com.hostel.shared.enums.FeeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface FeeRepository extends JpaRepository<FeeRecord, Long> {
    List<FeeRecord> findByStudentIdOrderByMonthDesc(Long studentId);
    List<FeeRecord> findByStatus(FeeStatus status);
    Optional<FeeRecord> findByStudentIdAndMonth(Long studentId, String month);

    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM FeeRecord f WHERE f.student.id = :studentId AND f.status = 'PENDING'")
    BigDecimal sumPending(Long studentId);

    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM FeeRecord f WHERE f.student.id = :studentId AND f.status = 'PAID'")
    BigDecimal sumPaid(Long studentId);

    @Query("SELECT COUNT(f) FROM FeeRecord f WHERE f.student.id = :studentId AND f.status = 'PENDING' AND f.dueDate < CURRENT_DATE")
    long countOverdue(Long studentId);

    @Query("SELECT f FROM FeeRecord f WHERE f.status = 'PENDING' AND f.dueDate < CURRENT_DATE")
    List<FeeRecord> findAllOverdue();
}
