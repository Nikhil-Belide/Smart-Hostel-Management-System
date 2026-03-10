package com.hostel.module.gatepass;

import com.hostel.module.student.StudentRepository;
import com.hostel.shared.enums.GatepassStatus;
import com.hostel.shared.exception.BusinessException;
import com.hostel.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GatepassService {

    private final GatepassRepository gatepassRepository;
    private final QRCodeService qrCodeService;
    private final StudentRepository studentRepository;

    @Value("${app.gatepass.qr-expiry-hours:12}")
    private int qrExpiryHours;

    public GatepassDtos.Response requestGatepass(Long studentId, GatepassDtos.RequestDto request) {
        var student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        Gatepass gatepass = Gatepass.builder()
                .student(student)
                .reason(request.getReason())
                .destination(request.getDestination())
                .expectedReturn(request.getExpectedReturn())
                .requestedAt(LocalDateTime.now())
                .status(GatepassStatus.PENDING)
                .build();
        return toResponse(gatepassRepository.save(gatepass));
    }

    public GatepassDtos.Response approveGatepass(Long gatepassId, GatepassDtos.ApproveRequest request) {
        Gatepass gp = findOrThrow(gatepassId);

        if (gp.getStatus() != GatepassStatus.PENDING) {
            throw new BusinessException("Gatepass is not in PENDING state. Current: " + gp.getStatus());
        }

        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(qrExpiryHours);

        byte[] qrImage;
        try {
            String content = qrCodeService.buildQRContent(gp.getId(), token);
            qrImage = qrCodeService.generateQRCode(content);
        } catch (Exception e) {
            log.error("Failed to generate QR for gatepass {}: {}", gatepassId, e.getMessage());
            throw new BusinessException("Failed to generate QR code: " + e.getMessage());
        }

        gp.setStatus(GatepassStatus.APPROVED);
        gp.setApprovedAt(LocalDateTime.now());
        gp.setQrToken(token);
        gp.setQrCodeImage(qrImage);
        gp.setQrExpiresAt(expiresAt);
        gp.setWardenRemark(request.getRemark());

        log.info("Gatepass {} approved for student {}", gatepassId, gp.getStudent().getStudentId());
        return toResponse(gatepassRepository.save(gp));
    }

    public GatepassDtos.Response rejectGatepass(Long gatepassId, GatepassDtos.RejectRequest request) {
        Gatepass gp = findOrThrow(gatepassId);
        if (gp.getStatus() != GatepassStatus.PENDING) {
            throw new BusinessException("Only PENDING gatepasses can be rejected");
        }
        gp.setStatus(GatepassStatus.REJECTED);
        gp.setWardenRemark(request.getReason());
        return toResponse(gatepassRepository.save(gp));
    }

    public byte[] getQRImage(Long gatepassId, Long requestingStudentId) {
        Gatepass gp = findOrThrow(gatepassId);
        if (!gp.getStudent().getId().equals(requestingStudentId)) {
            throw new BusinessException("Access denied: Not your gatepass");
        }
        if (gp.getStatus() != GatepassStatus.APPROVED) {
            throw new BusinessException("Gatepass is not approved");
        }
        if (gp.getQrExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("QR code has expired");
        }
        return gp.getQrCodeImage();
    }

    /**
     * Called by security guard scanner at the gate.
     * First scan = EXIT, Second scan = ENTRY.
     */
    public GatepassDtos.ScanResponse scanGatepass(String qrContent) {
        String[] parsed = qrCodeService.parseQRContent(qrContent);
        if (parsed == null) {
            return GatepassDtos.ScanResponse.invalid("Invalid QR code format");
        }

        Long gatepassId;
        try {
            gatepassId = Long.parseLong(parsed[0]);
        } catch (NumberFormatException e) {
            return GatepassDtos.ScanResponse.invalid("Invalid gatepass ID in QR");
        }
        String token = parsed[1];

        Gatepass gp = gatepassRepository.findById(gatepassId).orElse(null);
        if (gp == null || !token.equals(gp.getQrToken())) {
            return GatepassDtos.ScanResponse.invalid("Gatepass not found or token mismatch");
        }
        if (gp.getQrExpiresAt() != null && gp.getQrExpiresAt().isBefore(LocalDateTime.now())) {
            return GatepassDtos.ScanResponse.invalid("QR code has expired");
        }
        if (gp.getStatus() == GatepassStatus.USED) {
            return GatepassDtos.ScanResponse.invalid("Gatepass has already been fully used");
        }
        if (gp.getStatus() != GatepassStatus.APPROVED) {
            return GatepassDtos.ScanResponse.invalid("Gatepass is not approved. Status: " + gp.getStatus());
        }

        if (gp.getExitTime() == null) {
            // First scan: EXIT
            gp.setExitTime(LocalDateTime.now());
            gatepassRepository.save(gp);
            log.info("Student {} exited at {}", gp.getStudent().getStudentId(), gp.getExitTime());
            return GatepassDtos.ScanResponse.success("EXIT", "Exit recorded successfully", gp);
        } else {
            // Second scan: ENTRY
            gp.setEntryTime(LocalDateTime.now());
            gp.setStatus(GatepassStatus.USED);
            gatepassRepository.save(gp);
            log.info("Student {} returned at {}", gp.getStudent().getStudentId(), gp.getEntryTime());
            return GatepassDtos.ScanResponse.success("ENTRY", "Entry recorded. Gatepass complete.", gp);
        }
    }

    @Transactional(readOnly = true)
    public List<GatepassDtos.Response> getPendingGatepasses() {
        return gatepassRepository.findByStatus(GatepassStatus.PENDING).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<GatepassDtos.Response> getStudentGatepasses(Long studentId) {
        return gatepassRepository.findByStudentIdOrderByRequestedAtDesc(studentId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<GatepassDtos.Response> getAllGatepasses() {
        return gatepassRepository.findAllByOrderByRequestedAtDesc().stream().map(this::toResponse).toList();
    }

    // Expire approved gatepasses whose QR has passed expiry time — runs every hour
    @Scheduled(cron = "0 0 * * * *")
    public void expireOldGatepasses() {
        gatepassRepository.findByStatus(GatepassStatus.APPROVED).forEach(gp -> {
            if (gp.getQrExpiresAt() != null && gp.getQrExpiresAt().isBefore(LocalDateTime.now())) {
                gp.setStatus(GatepassStatus.EXPIRED);
                gatepassRepository.save(gp);
                log.info("Expired gatepass {} for student {}", gp.getId(), gp.getStudent().getStudentId());
            }
        });
    }

    private Gatepass findOrThrow(Long id) {
        return gatepassRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gatepass not found with id: " + id));
    }

    private GatepassDtos.Response toResponse(Gatepass gp) {
        GatepassDtos.Response res = new GatepassDtos.Response();
        res.setId(gp.getId());
        res.setStudentId(gp.getStudent().getId());
        res.setStudentName(gp.getStudent().getFullName());
        res.setStudentIdCode(gp.getStudent().getStudentId());
        res.setReason(gp.getReason());
        res.setDestination(gp.getDestination());
        res.setStatus(gp.getStatus());
        res.setRequestedAt(gp.getRequestedAt());
        res.setExpectedReturn(gp.getExpectedReturn());
        res.setApprovedAt(gp.getApprovedAt());
        res.setExitTime(gp.getExitTime());
        res.setEntryTime(gp.getEntryTime());
        res.setWardenRemark(gp.getWardenRemark());
        res.setHasQR(gp.getQrCodeImage() != null);
        res.setQrExpiresAt(gp.getQrExpiresAt());
        return res;
    }
}
