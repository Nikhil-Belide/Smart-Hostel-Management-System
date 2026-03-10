package com.hostel.module.room;

import com.hostel.module.student.Student;
import com.hostel.module.student.StudentRepository;
import com.hostel.shared.enums.BookingStatus;
import com.hostel.shared.enums.RoomStatus;
import com.hostel.shared.enums.RoomType;
import com.hostel.shared.exception.BusinessException;
import com.hostel.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RoomService {

    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final StudentRepository studentRepository;

    public RoomDtos.RoomResponse createRoom(RoomDtos.CreateRoomRequest request) {

        if (roomRepository.existsByRoomNumber(request.getRoomNumber())) {
            throw new BusinessException("Room number already exists: " + request.getRoomNumber());
        }

        Room room = Room.builder()
                .roomNumber(request.getRoomNumber())
                .type(request.getType())
                .capacity(request.getCapacity())
                .floor(request.getFloor())
                .block(request.getBlock())
                .monthlyFee(request.getMonthlyFee())
                .amenities(request.getAmenities())
                .description(request.getDescription())
                .status(RoomStatus.AVAILABLE)
                .build();

        room = roomRepository.save(room);

        return toRoomResponse(room);
    }

    @Transactional(readOnly = true)
    public List<RoomDtos.RoomResponse> getAllRooms() {
        return roomRepository.findAll()
                .stream()
                .map(this::toRoomResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoomDtos.RoomResponse> getAvailableRooms(RoomType type) {

        List<Room> rooms = (type != null)
                ? roomRepository.findByStatusAndType(RoomStatus.AVAILABLE, type)
                : roomRepository.findByStatus(RoomStatus.AVAILABLE);

        return rooms.stream()
                .map(this::toRoomResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RoomDtos.RoomResponse getRoomById(Long id) {
        return toRoomResponse(findRoomOrThrow(id));
    }

    public RoomDtos.RoomResponse updateRoom(Long id, RoomDtos.UpdateRoomRequest request) {

        Room room = findRoomOrThrow(id);

        if (request.getType() != null) room.setType(request.getType());
        if (request.getCapacity() != null) room.setCapacity(request.getCapacity());
        if (request.getFloor() != null) room.setFloor(request.getFloor());
        if (request.getBlock() != null) room.setBlock(request.getBlock());
        if (request.getMonthlyFee() != null) room.setMonthlyFee(request.getMonthlyFee());
        if (request.getStatus() != null) room.setStatus(request.getStatus());
        if (request.getAmenities() != null) room.setAmenities(request.getAmenities());
        if (request.getDescription() != null) room.setDescription(request.getDescription());

        room = roomRepository.save(room);

        return toRoomResponse(room);
    }

    public RoomDtos.BookingResponse allocateRoom(RoomDtos.BookingRequest request) {

        if (bookingRepository.existsByStudentIdAndStatus(request.getStudentId(), BookingStatus.ACTIVE)) {
            throw new BusinessException("Student already has an active room allocation");
        }

        Room room = findRoomOrThrow(request.getRoomId());

        if (room.getStatus() == RoomStatus.MAINTENANCE) {
            throw new BusinessException("Room is under maintenance");
        }

        long occupants = bookingRepository.countActiveByRoom(room.getId());

        if (occupants >= room.getCapacity()) {
            throw new BusinessException("Room is at full capacity");
        }

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        Booking booking = Booking.builder()
                .student(student)
                .room(room)
                .checkInDate(request.getCheckInDate())
                .status(BookingStatus.ACTIVE)
                .notes(request.getNotes())
                .build();

        booking = bookingRepository.save(booking);

        updateRoomStatus(room);

        return toBookingResponse(booking);
    }

    public RoomDtos.BookingResponse checkout(Long bookingId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getStatus() != BookingStatus.ACTIVE) {
            throw new BusinessException("Booking is not active");
        }

        booking.setStatus(BookingStatus.CHECKED_OUT);
        booking.setCheckOutDate(LocalDate.now());

        booking = bookingRepository.save(booking);

        updateRoomStatus(booking.getRoom());

        return toBookingResponse(booking);
    }

    @Transactional(readOnly = true)
    public RoomDtos.OccupancyReport getOccupancyReport() {

        List<Room> all = roomRepository.findAll();

        long total = all.size();
        long available = all.stream().filter(r -> r.getStatus() == RoomStatus.AVAILABLE).count();
        long occupied = all.stream().filter(r -> r.getStatus() == RoomStatus.OCCUPIED).count();
        long maintenance = all.stream().filter(r -> r.getStatus() == RoomStatus.MAINTENANCE).count();

        long totalCapacity = all.stream().mapToLong(Room::getCapacity).sum();

        long totalOccupants = bookingRepository.findByStatus(BookingStatus.ACTIVE).size();

        RoomDtos.OccupancyReport report = new RoomDtos.OccupancyReport();

        report.setTotalRooms(total);
        report.setAvailableRooms(available);
        report.setOccupiedRooms(occupied);
        report.setMaintenanceRooms(maintenance);
        report.setTotalCapacity(totalCapacity);
        report.setTotalOccupants(totalOccupants);
        report.setOccupancyRate(totalCapacity > 0
                ? (double) totalOccupants / totalCapacity * 100
                : 0);

        return report;
    }

    private void updateRoomStatus(Room room) {

        long occupants = bookingRepository.countActiveByRoom(room.getId());

        if (occupants >= room.getCapacity()) {
            room.setStatus(RoomStatus.OCCUPIED);
        } else {
            room.setStatus(RoomStatus.AVAILABLE);
        }

        roomRepository.save(room);
    }

    private Room findRoomOrThrow(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));
    }

    private RoomDtos.RoomResponse toRoomResponse(Room room) {

        RoomDtos.RoomResponse res = new RoomDtos.RoomResponse();

        res.setId(room.getId());
        res.setRoomNumber(room.getRoomNumber());
        res.setType(room.getType());
        res.setCapacity(room.getCapacity());
        res.setFloor(room.getFloor());
        res.setBlock(room.getBlock());
        res.setMonthlyFee(room.getMonthlyFee());
        res.setAmenities(room.getAmenities());

        long occupants = bookingRepository.countActiveByRoom(room.getId());

        res.setCurrentOccupants(occupants);
        res.setAvailableSlots((int) (room.getCapacity() - occupants));

        if (occupants >= room.getCapacity()) {
            res.setStatus(RoomStatus.OCCUPIED);
        } else {
            res.setStatus(RoomStatus.AVAILABLE);
        }

        return res;
    }

    private RoomDtos.BookingResponse toBookingResponse(Booking b) {

        RoomDtos.BookingResponse res = new RoomDtos.BookingResponse();

        res.setId(b.getId());
        res.setStudentId(b.getStudent().getId());
        res.setStudentName(b.getStudent().getFullName());
        res.setStudentIdCode(b.getStudent().getStudentId());

        res.setRoomId(b.getRoom().getId());
        res.setRoomNumber(b.getRoom().getRoomNumber());
        res.setRoomType(b.getRoom().getType());

        res.setCheckInDate(b.getCheckInDate());
        res.setCheckOutDate(b.getCheckOutDate());
        res.setStatus(b.getStatus());
        res.setCreatedAt(b.getCreatedAt());

        return res;
    }
}