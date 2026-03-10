package com.hostel.module.room;

import com.hostel.shared.enums.BookingStatus;
import com.hostel.shared.enums.RoomStatus;
import com.hostel.shared.enums.RoomType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class RoomDtos {

    @Data
    public static class CreateRoomRequest {
        @NotBlank private String roomNumber;
        @NotNull private RoomType type;
        @NotNull @Positive private Integer capacity;
        private Integer floor;
        private String block;
        @NotNull @Positive private BigDecimal monthlyFee;
        private String amenities;
        private String description;
    }

    @Data
    public static class UpdateRoomRequest {
        private RoomType type;
        private Integer capacity;
        private Integer floor;
        private String block;
        private BigDecimal monthlyFee;
        private RoomStatus status;
        private String amenities;
        private String description;
    }

    @Data
    public static class BookingRequest {
        @NotNull private Long studentId;
        @NotNull private Long roomId;
        @NotNull private LocalDate checkInDate;
        private String notes;
    }

    @Data
    public static class RoomResponse {
        private Long id;
        private String roomNumber;
        private RoomType type;
        private RoomStatus status;
        private Integer capacity;
        private Integer floor;
        private String block;
        private BigDecimal monthlyFee;
        private String amenities;
        private long currentOccupants;
        private int availableSlots;
    }

    @Data
    public static class BookingResponse {
        private Long id;
        private Long studentId;
        private String studentName;
        private String studentIdCode;
        private Long roomId;
        private String roomNumber;
        private RoomType roomType;
        private LocalDate checkInDate;
        private LocalDate checkOutDate;
        private BookingStatus status;
        private LocalDateTime createdAt;
    }

    @Data
    public static class OccupancyReport {
        private long totalRooms;
        private long availableRooms;
        private long occupiedRooms;
        private long maintenanceRooms;
        private long totalCapacity;
        private long totalOccupants;
        private double occupancyRate;
    }
}
