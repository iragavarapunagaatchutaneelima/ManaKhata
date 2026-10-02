package com.manaKhata.grocery;

import com.manaKhata.common.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "grocery_items")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class GroceryItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grocery_list_id", nullable = false)
    @JsonIgnoreProperties({"items","hibernateLazyInitializer","handler"})
    private GroceryList groceryList;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "unit")
    private String unit;

    @Column(name = "estimated_price")
    private Double estimatedPrice;

    @Column(name = "is_checked")
    @Builder.Default
    private Boolean isChecked = false;

    @Column(name = "category")
    private String category;
}
