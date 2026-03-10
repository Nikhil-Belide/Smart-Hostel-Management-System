package com.hostel.module.fee;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByFeeRecordId(Long feeRecordId);
}
