package com.hostel.module.fee;

import com.hostel.module.auth.AppUser;
import com.hostel.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/fees")
@RequiredArgsConstructor
public class FeeController {

    private final FeeService feeService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<ApiResponse<List<FeeDtos.FeeRecordResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(feeService.getAllFees()));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN') or (hasRole('STUDENT') and @studentSecurity.isOwner(authentication, #studentId))")
    public ResponseEntity<ApiResponse<FeeDtos.StudentFeeSummary>> getStudentSummary(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(feeService.getStudentFeeSummary(studentId)));
    }

    @GetMapping("/my-fees")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<FeeDtos.StudentFeeSummary>> getMyFees(
            @AuthenticationPrincipal AppUser user) {
        return ResponseEntity.ok(ApiResponse.success(
                feeService.getStudentFeeSummary(user.getStudent().getId())));
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<ApiResponse<List<FeeDtos.FeeRecordResponse>>> getOverdue() {
        return ResponseEntity.ok(ApiResponse.success(feeService.getOverdueFees()));
    }

    @PostMapping("/payment")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<ApiResponse<FeeDtos.PaymentResponse>> recordPayment(
            @Valid @RequestBody FeeDtos.PaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Payment recorded", feeService.recordPayment(request)));
    }

    @PostMapping("/generate-monthly")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> generateMonthly() {
        feeService.generateMonthlyFeeRecords();
        return ResponseEntity.ok(ApiResponse.success("Monthly fees generated successfully", null));
    }
}
