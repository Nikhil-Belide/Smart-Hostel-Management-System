package com.hostel.module.room;

import com.hostel.shared.enums.RoomStatus;
import com.hostel.shared.enums.RoomType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = "bookings")
@ToString(exclude = "bookings")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String roomNumber; // e.g. A-101

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomStatus status;

    @Column(nullable = false)
    private Integer capacity;

    private Integer floor;
    private String block;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyFee;

    private String amenities;
    private String description;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Booking> bookings = new ArrayList<>();
}
