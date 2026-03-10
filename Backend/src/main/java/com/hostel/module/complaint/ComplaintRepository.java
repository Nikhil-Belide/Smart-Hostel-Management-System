package com.hostel.module.complaint;

import com.hostel.shared.enums.ComplaintCategory;
import com.hostel.shared.enums.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByStudentId(Long studentId);
    List<Complaint> findByStatus(ComplaintStatus status);
    List<Complaint> findByCategory(ComplaintCategory category);
    List<Complaint> findByStatusOrderByPriorityLevelDesc(ComplaintStatus status);
    List<Complaint> findAllByOrderByPriorityLevelDescRaisedAtDesc();
}
