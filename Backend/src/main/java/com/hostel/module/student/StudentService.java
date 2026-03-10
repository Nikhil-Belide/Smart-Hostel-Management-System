package com.hostel.module.student;

import com.hostel.module.auth.AppUser;
import com.hostel.module.auth.AppUserRepository;
import com.hostel.module.room.Booking;
import com.hostel.module.room.BookingRepository;
import com.hostel.module.room.Room;
import com.hostel.module.room.RoomRepository;
import com.hostel.shared.enums.BookingStatus;
import com.hostel.shared.enums.Role;
import com.hostel.shared.enums.RoomStatus;
import com.hostel.shared.enums.StudentStatus;
import com.hostel.shared.exception.BusinessException;
import com.hostel.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StudentService {

    private final StudentRepository studentRepository;
    private final AppUserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;
     private final RoomRepository roomRepository;

    public StudentDtos.Response register(StudentDtos.RegisterRequest request) {

    if (studentRepository.existsByEmail(request.getEmail())) {
        throw new BusinessException("Email already registered: " + request.getEmail());
    }

    Student student = Student.builder()
            .studentId("Temp")
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .email(request.getEmail())
            .phone(request.getPhone())
            .course(request.getCourse())
            .yearOfStudy(request.getYearOfStudy())
            .parentName(request.getParentName())
            .parentPhone(request.getParentPhone())
            .parentEmail(request.getParentEmail())
            .address(request.getAddress())
            .dateOfBirth(request.getDateOfBirth())
            .gender(request.getGender())
            .bloodGroup(request.getBloodGroup())
            .emergencyContact(request.getEmergencyContact())
            .status(StudentStatus.ACTIVE)
            .build();

    student = studentRepository.save(student);

    String studentId = String.format("S-%d-%04d",
            LocalDate.now().getYear(),
            student.getId());

    student.setStudentId(studentId);
    student = studentRepository.save(student);

    AppUser user = AppUser.builder()
            .username(request.getEmail())
            .password(passwordEncoder.encode(studentId))
            .role(Role.STUDENT)
            .student(student)
            .build();

    userRepository.save(user);

    log.info("Registered new student: {} with ID: {}", student.getFullName(), studentId);

    return toResponse(student);
}

 
   @Transactional(readOnly = true)
    public List<StudentDtos.Response> getAllStudents() {
     return studentRepository.findByStatusNot(StudentStatus.DELETED)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentDtos.Response> getActiveStudents() {
        return studentRepository.findByStatus(StudentStatus.ACTIVE).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public StudentDtos.Response getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<StudentDtos.Response> search(String query) {
        return studentRepository.search(query).stream().map(this::toResponse).toList();
    }

    public StudentDtos.Response update(Long id, StudentDtos.UpdateRequest request) {
        Student student = findOrThrow(id);
        if (request.getFirstName() != null) student.setFirstName(request.getFirstName());
        if (request.getLastName() != null) student.setLastName(request.getLastName());
        if (request.getPhone() != null) student.setPhone(request.getPhone());
        if (request.getCourse() != null) student.setCourse(request.getCourse());
        if (request.getYearOfStudy() != null) student.setYearOfStudy(request.getYearOfStudy());
        if (request.getParentName() != null) student.setParentName(request.getParentName());
        if (request.getParentPhone() != null) student.setParentPhone(request.getParentPhone());
        if (request.getParentEmail() != null) student.setParentEmail(request.getParentEmail());
        if (request.getAddress() != null) student.setAddress(request.getAddress());
        if (request.getBloodGroup() != null) student.setBloodGroup(request.getBloodGroup());
        if (request.getEmergencyContact() != null) student.setEmergencyContact(request.getEmergencyContact());
        if (request.getStatus() != null) student.setStatus(request.getStatus());
        return toResponse(studentRepository.save(student));
    }

@Transactional
public void delete(Long id) {

    Student student = findOrThrow(id);

    List<Booking> activeBookings =
            bookingRepository.findAllByStudentIdAndStatus(student.getId(), BookingStatus.ACTIVE);

    if (!activeBookings.isEmpty()) {
        throw new BusinessException("Student must checkout before deletion");
    }

    student.setStatus(StudentStatus.DELETED);
    studentRepository.save(student);
}

    private Student findOrThrow(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
    }

    StudentDtos.Response toResponse(Student s) {
        StudentDtos.Response res = new StudentDtos.Response();
        res.setId(s.getId());
        res.setStudentId(s.getStudentId());
        res.setFirstName(s.getFirstName());
        res.setLastName(s.getLastName());
        res.setFullName(s.getFullName());
        res.setEmail(s.getEmail());
        res.setPhone(s.getPhone());
        res.setCourse(s.getCourse());
        res.setYearOfStudy(s.getYearOfStudy());
        res.setParentName(s.getParentName());
        res.setParentPhone(s.getParentPhone());
        res.setGender(s.getGender());
        res.setBloodGroup(s.getBloodGroup());
        res.setStatus(s.getStatus());
        res.setCreatedAt(s.getCreatedAt());

        // Current room
        bookingRepository.findByStudentIdAndStatus(s.getId(), BookingStatus.ACTIVE)
                .ifPresent(b -> res.setCurrentRoom(b.getRoom().getRoomNumber()));

        return res;
    }


@Transactional
public void checkout(Long id) {

    Student student = findOrThrow(id);

    List<Booking> activeBookings = bookingRepository
            .findAllByStudentIdAndStatus(student.getId(), BookingStatus.ACTIVE);

    if (activeBookings.isEmpty()) {
        throw new BusinessException("No active booking found");
    }

    for (Booking booking : activeBookings) {

        booking.setStatus(BookingStatus.CHECKED_OUT);
        bookingRepository.save(booking);

        Room room = booking.getRoom();

        long occupants = bookingRepository.countActiveByRoom(room.getId());

        if (occupants == 0) {
            room.setStatus(RoomStatus.AVAILABLE);
        } else if (occupants < room.getCapacity()) {
            room.setStatus(RoomStatus.AVAILABLE);
        } else {
            room.setStatus(RoomStatus.OCCUPIED);
        }

        roomRepository.save(room);
    }

    student.setStatus(StudentStatus.CHECKED_OUT);
}}
