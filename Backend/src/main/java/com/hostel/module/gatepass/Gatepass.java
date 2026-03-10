package com.hostel.module.gatepass;

import com.hostel.module.student.Student;
import com.hostel.shared.enums.GatepassStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "gatepasses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Gatepass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private String reason;

    private String destination;

    @Column(nullable = false)
    private LocalDateTime requestedAt;

    private LocalDateTime expectedReturn;
    private LocalDateTime approvedAt;
    private LocalDateTime exitTime;
    private LocalDateTime entryTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GatepassStatus status;

    @Column(unique = true)
    private String qrToken; // UUID

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] qrCodeImage; // PNG bytes

    private LocalDateTime qrExpiresAt;
    private String wardenRemark;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
