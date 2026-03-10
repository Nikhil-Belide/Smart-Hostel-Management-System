package com.hostel.module.gatepass;

import com.hostel.shared.enums.GatepassStatus;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

public class GatepassDtos {

    @Data
    public static class RequestDto {
        @NotBlank(message = "Reason is required")
        private String reason;

        private String destination;

        @NotNull @Future(message = "Expected return must be in the future")
        private LocalDateTime expectedReturn;
    }

    @Data
    public static class ApproveRequest {
        private String remark;
    }

    @Data
    public static class RejectRequest {
        @NotBlank private String reason;
    }

    @Data
    public static class ScanResponse {
        private boolean valid;
        private String message;
        private String action; // EXIT or ENTRY
        private Long gatepassId;
        private String studentName;
        private String studentId;
        private LocalDateTime exitTime;
        private LocalDateTime entryTime;
        private LocalDateTime expectedReturn;

        public static ScanResponse invalid(String message) {
            ScanResponse r = new ScanResponse();
            r.setValid(false);
            r.setMessage(message);
            return r;
        }

        public static ScanResponse success(String action, String message, Gatepass gp) {
            ScanResponse r = new ScanResponse();
            r.setValid(true);
            r.setAction(action);
            r.setMessage(message);
            r.setGatepassId(gp.getId());
            r.setStudentName(gp.getStudent().getFullName());
            r.setStudentId(gp.getStudent().getStudentId());
            r.setExitTime(gp.getExitTime());
            r.setEntryTime(gp.getEntryTime());
            r.setExpectedReturn(gp.getExpectedReturn());
            return r;
        }
    }

    @Data
    public static class Response {
        private Long id;
        private Long studentId;
        private String studentName;
        private String studentIdCode;
        private String reason;
        private String destination;
        private GatepassStatus status;
        private LocalDateTime requestedAt;
        private LocalDateTime expectedReturn;
        private LocalDateTime approvedAt;
        private LocalDateTime exitTime;
        private LocalDateTime entryTime;
        private String wardenRemark;
        private boolean hasQR;
        private LocalDateTime qrExpiresAt;
    }
}
