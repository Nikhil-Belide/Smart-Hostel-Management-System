package com.hostel.module.gatepass;

import com.hostel.module.auth.AppUser;
import com.hostel.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/gatepasses")
@RequiredArgsConstructor
public class GatepassController {

    private final GatepassService gatepassService;

    /** Student requests a gatepass */
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<GatepassDtos.Response>> request(
            @Valid @RequestBody GatepassDtos.RequestDto dto,
            @AuthenticationPrincipal AppUser user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gatepass request submitted",
                        gatepassService.requestGatepass(user.getStudent().getId(), dto)));
    }

    /** Warden views all pending gatepass requests */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<GatepassDtos.Response>>> getPending() {
        return ResponseEntity.ok(ApiResponse.success(gatepassService.getPendingGatepasses()));
    }

    /** Warden/Admin views all gatepasses */
    @GetMapping
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<GatepassDtos.Response>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(gatepassService.getAllGatepasses()));
    }

    /** Student views their own gatepasses */
    @GetMapping("/my-gatepasses")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<GatepassDtos.Response>>> myGatepasses(
            @AuthenticationPrincipal AppUser user) {
        return ResponseEntity.ok(ApiResponse.success(
                gatepassService.getStudentGatepasses(user.getStudent().getId())));
    }

    /** Warden approves and QR is generated */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<ApiResponse<GatepassDtos.Response>> approve(
            @PathVariable Long id,
            @RequestBody(required = false) GatepassDtos.ApproveRequest request) {
        if (request == null) request = new GatepassDtos.ApproveRequest();
        return ResponseEntity.ok(ApiResponse.success("Gatepass approved and QR generated",
                gatepassService.approveGatepass(id, request)));
    }

    /** Warden rejects */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<ApiResponse<GatepassDtos.Response>> reject(
            @PathVariable Long id,
            @Valid @RequestBody GatepassDtos.RejectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Gatepass rejected",
                gatepassService.rejectGatepass(id, request)));
    }

    /** Student downloads their QR code image */
    @GetMapping(value = "/{id}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<byte[]> getQRCode(
            @PathVariable Long id,
            @AuthenticationPrincipal AppUser user) {
        byte[] image = gatepassService.getQRImage(id, user.getStudent().getId());
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(image);
    }

    /** Security guard scans QR at gate */
    @PostMapping("/scan")
    @PreAuthorize("hasAnyRole('SECURITY', 'ADMIN', 'WARDEN')")
    public ResponseEntity<ApiResponse<GatepassDtos.ScanResponse>> scan(
            @RequestParam String qrContent) {
        GatepassDtos.ScanResponse result = gatepassService.scanGatepass(qrContent);
        return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
    }
}
