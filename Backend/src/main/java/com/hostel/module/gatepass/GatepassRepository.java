package com.hostel.module.gatepass;

import com.hostel.shared.enums.GatepassStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GatepassRepository extends JpaRepository<Gatepass, Long> {
    List<Gatepass> findByStudentId(Long studentId);
    List<Gatepass> findByStatus(GatepassStatus status);
    Optional<Gatepass> findByQrToken(String qrToken);
    List<Gatepass> findByStudentIdOrderByRequestedAtDesc(Long studentId);
    List<Gatepass> findAllByOrderByRequestedAtDesc();
}
