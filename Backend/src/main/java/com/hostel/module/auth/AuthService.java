package com.hostel.module.auth;

import com.hostel.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final AppUserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthDtos.TokenResponse login(AuthDtos.LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        AppUser user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("User not found"));
        String accessToken = jwtUtil.generateToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);
        return new AuthDtos.TokenResponse(accessToken, refreshToken, user.getRole().name(), user.getUsername());
    }

    public void changePassword(String username, AuthDtos.ChangePasswordRequest request) {
        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BusinessException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public AuthDtos.TokenResponse refreshToken(String refreshToken) {
        String username = jwtUtil.extractUsername(refreshToken);
        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));
        if (!jwtUtil.isTokenValid(refreshToken, user)) {
            throw new BusinessException("Invalid or expired refresh token");
        }
        String newAccessToken = jwtUtil.generateToken(user);
        String newRefreshToken = jwtUtil.generateRefreshToken(user);
        return new AuthDtos.TokenResponse(newAccessToken, newRefreshToken, user.getRole().name(), user.getUsername());
    }
}
