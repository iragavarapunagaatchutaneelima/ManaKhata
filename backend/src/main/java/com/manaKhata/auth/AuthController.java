package com.manaKhata.auth;

import com.manaKhata.common.ApiResponse;
import com.manaKhata.household.Household;
import com.manaKhata.household.HouseholdRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class AuthController {

    private final UserRepository userRepository;
    private final HouseholdRepository householdRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Email already registered"));
        }

        Household household;

        if (request.getInviteCode() != null && !request.getInviteCode().isBlank()) {
            // Joining existing household
            household = householdRepository.findByInviteCode(request.getInviteCode())
                    .orElseThrow(() -> new RuntimeException("Invalid invite code"));
        } else {
            // Creating new household
            household = householdRepository.save(Household.builder()
                    .name(request.getHouseholdName() != null ? request.getHouseholdName() : request.getFullName() + "'s Household")
                    .country("India")
                    .currency("INR")
                    .monthlyIncome(request.getMonthlyIncome())
                    .inviteCode(generateInviteCode())
                    .isActive(true)
                    .build());
        }

        boolean isHousehead = request.getInviteCode() == null;

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(isHousehead ? UserRole.HOUSEHEAD : request.getRole())
                .gender(request.getGender())
                .household(household)
                .isHousehead(isHousehead)
                .monthlyIncome(request.getMonthlyIncome())
                .walletBalance(0.0)
                .canViewHousehold(isHousehead)
                .canViewAnalytics(isHousehead)
                .canManageExpenses(true)
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(savedUser);
        String refreshToken = jwtService.generateRefreshToken(savedUser);

        log.info("User registered: {} | Household: {} | HouseHead: {}", savedUser.getEmail(), household.getId(), isHousehead);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        AuthResponse.from(savedUser, token, refreshToken, household),
                        "Registration successful"
                ));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid email or password"));
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();

        String token = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        log.info("User logged in: {}", user.getEmail());

        return ResponseEntity.ok(ApiResponse.success(
                AuthResponse.from(user, token, refreshToken, user.getHousehold()),
                "Login successful"
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid token"));
        }
        String refreshToken = authHeader.substring(7);
        String email = jwtService.extractUsername(refreshToken);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newToken = jwtService.generateToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        return ResponseEntity.ok(ApiResponse.success(
                AuthResponse.from(user, newToken, newRefreshToken, user.getHousehold()),
                "Token refreshed"
        ));
    }

    private String generateInviteCode() {
        String code;
        do {
            code = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (householdRepository.existsByInviteCode(code));
        return code;
    }
}
