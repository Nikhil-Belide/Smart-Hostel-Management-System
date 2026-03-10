package com.hostel.config;

import com.hostel.module.auth.AppUser;
import com.hostel.module.auth.AppUserRepository;
import com.hostel.shared.enums.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUser("admin@hostel.com", "Admin@123", Role.ADMIN);
        seedUser("warden@hostel.com", "Warden@123", Role.WARDEN);
        seedUser("security@hostel.com", "Security@123", Role.SECURITY);
    }

    private void seedUser(String email, String password, Role role) {
        if (!userRepository.existsByUsername(email)) {
            AppUser user = AppUser.builder()
                    .username(email)
                    .password(passwordEncoder.encode(password))
                    .role(role)
                    .build();
            userRepository.save(user);
            log.info("Created {} account: {} / {}", role, email, password);
        }
    }
}
