package com.manaKhata.grocery;

import lombok.Data;

@Data
public class GroceryItemRequest {
    private String name;
    private Integer quantity;
    private String unit;
    private Double estimatedPrice;
    private String category;
}
