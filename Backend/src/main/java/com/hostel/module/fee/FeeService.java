package com.hostel.module.fee;

import com.hostel.module.room.Booking;
import com.hostel.module.room.BookingRepository;
import com.hostel.module.student.StudentRepository;
import com.hostel.shared.enums.BookingStatus;
import com.hostel.shared.enums.FeeStatus;
import com.hostel.shared.exception.BusinessException;
import com.hostel.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FeeService {

    private final FeeRepository feeRepository;
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final StudentRepository studentRepository;

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");
@Scheduled(cron = "0 0 8 * * *")
public void generateMonthlyFeeRecords() {

    List<Booking> activeBookings = bookingRepository.findByStatus(BookingStatus.ACTIVE);

    for (Booking booking : activeBookings) {

        if (booking.getRoom() == null) continue;

        Double hostelFee = booking.getStudent().getHostelFee();
        if (hostelFee == null || hostelFee <= 0) continue;

        LocalDate checkInDate = booking.getCheckInDate();
        LocalDate today = LocalDate.now();

        long monthsElapsed = java.time.temporal.ChronoUnit.MONTHS.between(checkInDate, today);

        if (monthsElapsed <= 0) continue;

        for (long month = 1; month <= monthsElapsed; month++) {
            LocalDate feeDate = checkInDate.plusMonths(month);
            String expectedMonth = feeDate.format(MONTH_FMT);

            boolean alreadyExists = feeRepository
                    .findByStudentIdAndMonth(booking.getStudent().getId(), expectedMonth)
                    .isPresent();

            if (!alreadyExists) {
                FeeRecord fee = FeeRecord.builder()
                        .student(booking.getStudent())
                        .room(booking.getRoom())
                        .amount(BigDecimal.valueOf(hostelFee))
                        .month(expectedMonth)
                        .dueDate(feeDate)
                        .status(FeeStatus.PENDING)
                        .build();

                feeRepository.save(fee);
                log.info("Generated fee for student {} month {}",
                        booking.getStudent().getStudentId(), expectedMonth);
            }
        }
    }
}

    // Manually trigger (for admin / testing)
    public int generateFeesForCurrentMonth() {
        generateMonthlyFeeRecords();
        String currentMonth = YearMonth.now().format(MONTH_FMT);
        return (int) feeRepository.findByStudentIdOrderByMonthDesc(-1L).size(); // just a trigger
    }

   public FeeDtos.PaymentResponse recordPayment(FeeDtos.PaymentRequest request) {
    FeeRecord fee = feeRepository.findById(request.getFeeRecordId())
            .orElseThrow(() -> new ResourceNotFoundException("Fee record not found"));
    if (fee.getStatus() == FeeStatus.PAID) {
        throw new BusinessException("Fee is already paid");
    }

    // Step 1 - Calculate already paid BEFORE saving new payment
    BigDecimal alreadyPaid = paymentRepository.findByFeeRecordId(fee.getId())
            .stream()
            .map(Payment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    // Step 2 - Save the new payment (only once)
    Payment payment = Payment.builder()
            .feeRecord(fee)
            .amount(request.getAmount())
            .paymentMode(request.getMode())
            .transactionId(request.getTransactionId())
            .referenceNumber(request.getReferenceNumber())
            .remarks(request.getRemarks())
            .paidAt(LocalDateTime.now())
            .build();
    payment = paymentRepository.save(payment);

    // Step 3 - Total = previous payments + this new payment
    BigDecimal totalPaid = alreadyPaid.add(request.getAmount());

    // Step 4 - Update fee status
    if (totalPaid.compareTo(fee.getAmount()) >= 0) {
        fee.setStatus(FeeStatus.PAID);
        fee.setPaidAt(LocalDateTime.now());
    } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
        fee.setStatus(FeeStatus.PARTIAL);
    } else {
        fee.setStatus(FeeStatus.PENDING);
    }
    feeRepository.save(fee);

    FeeDtos.PaymentResponse res = new FeeDtos.PaymentResponse();
    res.setId(payment.getId());
    res.setAmount(payment.getAmount());
    res.setPaymentMode(payment.getPaymentMode());
    res.setTransactionId(payment.getTransactionId());
    res.setPaidAt(payment.getPaidAt());
    return res;
}

    @Transactional(readOnly = true)
    public FeeDtos.StudentFeeSummary getStudentFeeSummary(Long studentId) {
        var student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        List<FeeRecord> records = feeRepository.findByStudentIdOrderByMonthDesc(studentId);

        FeeDtos.StudentFeeSummary summary = new FeeDtos.StudentFeeSummary();
        summary.setStudentId(studentId);
        summary.setStudentName(student.getFullName());
        summary.setTotalPending(feeRepository.sumPending(studentId));
        summary.setTotalPaid(feeRepository.sumPaid(studentId));
        summary.setOverdueCount(feeRepository.countOverdue(studentId));
        summary.setHistory(records.stream().map(this::toFeeResponse).toList());
        return summary;
    }

    @Transactional(readOnly = true)
    public List<FeeDtos.FeeRecordResponse> getOverdueFees() {
        return feeRepository.findAllOverdue().stream().map(this::toFeeResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<FeeDtos.FeeRecordResponse> getAllFees() {
        return feeRepository.findAll().stream().map(this::toFeeResponse).toList();
    }


    
    private FeeDtos.FeeRecordResponse toFeeResponse(FeeRecord f) {
    FeeDtos.FeeRecordResponse res = new FeeDtos.FeeRecordResponse();
    res.setId(f.getId());
    res.setStudentId(f.getStudent().getId());
    res.setStudentName(f.getStudent().getFullName());
    res.setStudentIdCode(f.getStudent().getStudentId());
    res.setRoomNumber(f.getRoom() != null ? f.getRoom().getRoomNumber() : "N/A");
    res.setAmount(f.getAmount());
    res.setMonth(f.getMonth());
    res.setDueDate(f.getDueDate());
    res.setStatus(f.getStatus());
    res.setPaidAt(f.getPaidAt());
    res.setOverdue(f.getDueDate() != null && 
                   f.getStatus() != FeeStatus.PAID && 
                   f.getDueDate().isBefore(LocalDate.now()));

    List<Payment> payments = paymentRepository.findByFeeRecordId(f.getId());

    res.setPayments(payments.stream().map(p -> {
        FeeDtos.PaymentResponse pr = new FeeDtos.PaymentResponse();
        pr.setId(p.getId());
        pr.setAmount(p.getAmount());
        pr.setPaymentMode(p.getPaymentMode());
        pr.setTransactionId(p.getTransactionId());
        pr.setPaidAt(p.getPaidAt());
        return pr;
    }).toList());

    BigDecimal totalPaid = payments.stream()
            .map(Payment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    res.setTotalPaid(totalPaid);
    res.setRemainingAmount(f.getAmount().subtract(totalPaid));
    return res;
}
}
