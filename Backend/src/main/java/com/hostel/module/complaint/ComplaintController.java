package com.hostel.module.complaint;

import com.hostel.module.auth.AppUser;
import com.hostel.module.student.Student;
import com.hostel.module.student.StudentRepository;
import com.hostel.shared.dto.ApiResponse;
import com.hostel.shared.enums.ComplaintCategory;
import com.hostel.shared.enums.ComplaintStatus;
import com.hostel.shared.exception.BusinessException;
import com.hostel.shared.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

// ===== DTOs =====
class ComplaintDtos {

    @Data
    static class CreateRequest {
        @NotNull private ComplaintCategory category;
        @NotBlank private String title;
        private String description;
        @NotNull @Min(1) @Max(5) private Integer priorityLevel;
    }

    @Data
    static class AssignRequest {
        @NotBlank private String assignedTo;
    }

    @Data
    static class ResolveRequest {
        @NotBlank private String resolutionNote;
    }

    @Data
    static class Response {
        private Long id;
        private Long studentId;
        private String studentName;
        private String studentIdCode;
        private ComplaintCategory category;
        private String title;
        private String description;
        private Integer priorityLevel;
        private String priorityLabel;
        private ComplaintStatus status;
        private String assignedTo;
        private String resolutionNote;
        private LocalDateTime raisedAt;
        private LocalDateTime resolvedAt;
    }
}

// ===== SERVICE =====
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final StudentRepository studentRepository;

    public ComplaintDtos.Response raiseComplaint(Long studentId, ComplaintDtos.CreateRequest request) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        Complaint complaint = Complaint.builder()
                .student(student)
                .category(request.getCategory())
                .title(request.getTitle())
                .description(request.getDescription())
                .priorityLevel(request.getPriorityLevel())
                .status(ComplaintStatus.OPEN)
                .build();
        return toResponse(complaintRepository.save(complaint));
    }

    @Transactional(readOnly = true)
    public List<ComplaintDtos.Response> getAll() {
        return complaintRepository.findAllByOrderByPriorityLevelDescRaisedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ComplaintDtos.Response> getByStatus(ComplaintStatus status) {
        return complaintRepository.findByStatus(status).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ComplaintDtos.Response> getByStudent(Long studentId) {
        return complaintRepository.findByStudentId(studentId).stream().map(this::toResponse).toList();
    }

    public ComplaintDtos.Response assign(Long id, ComplaintDtos.AssignRequest request) {
        Complaint complaint = findOrThrow(id);
        complaint.setAssignedTo(request.getAssignedTo());
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        return toResponse(complaintRepository.save(complaint));
    }

    public ComplaintDtos.Response updateStatus(Long id, ComplaintStatus status) {
        Complaint complaint = findOrThrow(id);
        complaint.setStatus(status);
        return toResponse(complaintRepository.save(complaint));
    }

    public ComplaintDtos.Response resolve(Long id, ComplaintDtos.ResolveRequest request) {
        Complaint complaint = findOrThrow(id);
        if (complaint.getStatus() == ComplaintStatus.CLOSED) {
            throw new BusinessException("Complaint is already closed");
        }
        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setResolutionNote(request.getResolutionNote());
        complaint.setResolvedAt(LocalDateTime.now());
        return toResponse(complaintRepository.save(complaint));
    }

    private Complaint findOrThrow(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));
    }

    private String priorityLabel(int level) {
        return switch (level) {
            case 1 -> "Low";
            case 2 -> "Medium";
            case 3 -> "High";
            case 4 -> "Critical";
            case 5 -> "Emergency";
            default -> "Unknown";
        };
    }

    private ComplaintDtos.Response toResponse(Complaint c) {
        ComplaintDtos.Response res = new ComplaintDtos.Response();
        res.setId(c.getId());
        res.setStudentId(c.getStudent().getId());
        res.setStudentName(c.getStudent().getFullName());
        res.setStudentIdCode(c.getStudent().getStudentId());
        res.setCategory(c.getCategory());
        res.setTitle(c.getTitle());
        res.setDescription(c.getDescription());
        res.setPriorityLevel(c.getPriorityLevel());
        res.setPriorityLabel(priorityLabel(c.getPriorityLevel()));
        res.setStatus(c.getStatus());
        res.setAssignedTo(c.getAssignedTo());
        res.setResolutionNote(c.getResolutionNote());
        res.setRaisedAt(c.getRaisedAt());
        res.setResolvedAt(c.getResolvedAt());
        return res;
    }
}

// ===== CONTROLLER =====
@RestController
@RequestMapping("/api/v1/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<ComplaintDtos.Response>> create(
            @Valid @RequestBody ComplaintDtos.CreateRequest request,
            @AuthenticationPrincipal AppUser user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Complaint raised", complaintService.raiseComplaint(user.getStudent().getId(), request)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<ApiResponse<List<ComplaintDtos.Response>>> getAll(
            @RequestParam(required = false) ComplaintStatus status) {
        List<ComplaintDtos.Response> result = (status != null)
                ? complaintService.getByStatus(status)
                : complaintService.getAll();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/my-complaints")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<ComplaintDtos.Response>>> myComplaints(
            @AuthenticationPrincipal AppUser user) {
        return ResponseEntity.ok(ApiResponse.success(
                complaintService.getByStudent(user.getStudent().getId())));
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<ApiResponse<ComplaintDtos.Response>> assign(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintDtos.AssignRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Assigned", complaintService.assign(id, request)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<ApiResponse<ComplaintDtos.Response>> updateStatus(
            @PathVariable Long id,
            @RequestParam ComplaintStatus status) {
        return ResponseEntity.ok(ApiResponse.success(complaintService.updateStatus(id, status)));
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<ApiResponse<ComplaintDtos.Response>> resolve(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintDtos.ResolveRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Resolved", complaintService.resolve(id, request)));
    }
}
