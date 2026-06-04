package com.manaKhata.gamification;

import com.manaKhata.auth.User;
import com.manaKhata.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/badges")
@RequiredArgsConstructor
public class GamificationController {

    private final BadgeRepository badgeRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Badge>>> getBadges(
            @AuthenticationPrincipal User currentUser) {
        
        List<Badge> badges = badgeRepository.findByUserIdOrderByEarnedDateDesc(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(badges));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Badge>> awardBadge(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, String> body) {
        
        String name = body.get("name");
        String description = body.get("description");
        String icon = body.get("icon");
        
        Badge badge = Badge.builder()
                .name(name)
                .description(description)
                .icon(icon)
                .earnedDate(LocalDate.now())
                .user(currentUser)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(badgeRepository.save(badge)));
    }
}
