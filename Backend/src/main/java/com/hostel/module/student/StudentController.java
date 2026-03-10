package com.hostel.module.student;

import com.hostel.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<ApiResponse<StudentDtos.Response>> register(
            @Valid @RequestBody StudentDtos.RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student registered successfully", studentService.register(request)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<StudentDtos.Response>>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q) {
        List<StudentDtos.Response> result = (q != null && !q.isBlank())
                ? studentService.search(q)
                : ("ACTIVE".equalsIgnoreCase(status) ? studentService.getActiveStudents() : studentService.getAllStudents());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN') or (hasRole('STUDENT') and @studentSecurity.isOwner(authentication, #id))")
    public ResponseEntity<ApiResponse<StudentDtos.Response>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(studentService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<ApiResponse<StudentDtos.Response>> update(
            @PathVariable Long id,
            @RequestBody StudentDtos.UpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Student updated", studentService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        studentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Student deleted", null));
    }

    @PutMapping("/{id}/checkout")
    @PreAuthorize("hasAnyRole('ADMIN','WARDEN')")
    public ResponseEntity<ApiResponse<Void>> checkout(@PathVariable Long id) {
        studentService.checkout(id);
        return ResponseEntity.ok(ApiResponse.success("Student checked out", null));
}
}
