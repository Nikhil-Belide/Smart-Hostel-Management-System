package com.hostel.module.fee;

import com.hostel.shared.enums.FeeStatus;
import com.hostel.shared.enums.PaymentMode;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class FeeDtos {

    @Data
    public static class PaymentRequest {
        @NotNull private Long feeRecordId;
        @NotNull @Positive private BigDecimal amount;
        @NotNull private PaymentMode mode;
        private String transactionId;
        private String referenceNumber;
        private String remarks;
    }

    @Data
    public static class FeeRecordResponse {
        private Long id;
        private Long studentId;
        private String studentName;
        private String studentIdCode;
        private String roomNumber;
        private BigDecimal amount;
        private String month;
        private LocalDate dueDate;
        private FeeStatus status;
        private LocalDateTime paidAt;
        private boolean overdue;
        private BigDecimal totalPaid;
        private BigDecimal remainingAmount;
        private List<PaymentResponse> payments;
    }

    @Data
    public static class PaymentResponse {
        private Long id;
        private BigDecimal amount;
        private PaymentMode paymentMode;
        private String transactionId;
        private LocalDateTime paidAt;
    }

    @Data
    public static class StudentFeeSummary {
        private Long studentId;
        private String studentName;
        private BigDecimal totalPending;
        private BigDecimal totalPaid;
        private long overdueCount;
        private List<FeeRecordResponse> history;
    }
}
