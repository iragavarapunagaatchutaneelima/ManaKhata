package com.manaKhata.gamification;

import com.manaKhata.common.BaseEntity;
import com.manaKhata.auth.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "badges")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Badge extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "icon")
    private String icon;

    @Column(name = "earned_date", nullable = false)
    private LocalDate earnedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"household", "passwordHash", "hibernateLazyInitializer", "handler"})
    private User user;
}
