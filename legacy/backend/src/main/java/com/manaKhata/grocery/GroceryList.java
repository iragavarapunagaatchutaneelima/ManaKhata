package com.manaKhata.grocery;

import com.manaKhata.common.BaseEntity;
import com.manaKhata.household.Household;
import com.manaKhata.auth.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "grocery_lists")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class GroceryList extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @JsonIgnoreProperties({"members","hibernateLazyInitializer","handler"})
    private Household household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    @JsonIgnoreProperties({"household","passwordHash","hibernateLazyInitializer","handler"})
    private User createdBy;

    @Column(name = "is_completed")
    @Builder.Default
    private Boolean isCompleted = false;

    @OneToMany(mappedBy = "groceryList", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @Builder.Default
    private List<GroceryItem> items = new ArrayList<>();
}
