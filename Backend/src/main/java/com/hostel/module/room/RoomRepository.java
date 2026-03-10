package com.hostel.module.room;

import com.hostel.shared.enums.RoomStatus;
import com.hostel.shared.enums.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByRoomNumber(String roomNumber);
    List<Room> findByStatus(RoomStatus status);
    List<Room> findByStatusAndType(RoomStatus status, RoomType type);
    Optional<Room> findByIdAndStatus(Long id, RoomStatus status);
    boolean existsByRoomNumber(String roomNumber);
}
