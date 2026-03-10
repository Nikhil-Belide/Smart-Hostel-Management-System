package com.hostel.module.room;

import com.hostel.shared.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    boolean existsByStudentIdAndStatus(Long studentId, BookingStatus status);
    Optional<Booking> findByStudentIdAndStatus(Long studentId, BookingStatus status);
    List<Booking> findByStatus(BookingStatus status);
    List<Booking> findByRoomId(Long roomId);
    List<Booking> findAllByStudentIdAndStatus(Long studentId, BookingStatus status);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.room.id = :roomId AND b.status = 'ACTIVE'")
    long countActiveByRoom(Long roomId);
}
