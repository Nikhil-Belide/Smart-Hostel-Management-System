package com.hostel.module.room;

import com.hostel.shared.dto.ApiResponse;
import com.hostel.shared.enums.RoomType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoomDtos.RoomResponse>> create(
            @Valid @RequestBody RoomDtos.CreateRoomRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Room created", roomService.createRoom(request)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<ApiResponse<List<RoomDtos.RoomResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(roomService.getAllRooms()));
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<ApiResponse<List<RoomDtos.RoomResponse>>> getAvailable(
            @RequestParam(required = false) RoomType type) {
        return ResponseEntity.ok(ApiResponse.success(roomService.getAvailableRooms(type)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<ApiResponse<RoomDtos.RoomResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(roomService.getRoomById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<ApiResponse<RoomDtos.RoomResponse>> update(
            @PathVariable Long id,
            @RequestBody RoomDtos.UpdateRoomRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Room updated", roomService.updateRoom(id, request)));
    }

    @GetMapping("/occupancy")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<ApiResponse<RoomDtos.OccupancyReport>> getOccupancy() {
        return ResponseEntity.ok(ApiResponse.success(roomService.getOccupancyReport()));
    }
}

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
class BookingController {

    private final RoomService roomService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<ApiResponse<RoomDtos.BookingResponse>> allocate(
            @Valid @RequestBody RoomDtos.BookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Room allocated successfully", roomService.allocateRoom(request)));
    }

    @PostMapping("/{id}/checkout")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<ApiResponse<RoomDtos.BookingResponse>> checkout(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Student checked out", roomService.checkout(id)));
    }
}
