package com.manaKhata.grocery;

import com.manaKhata.auth.User;
import com.manaKhata.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/grocery")
@RequiredArgsConstructor
public class GroceryController {

    private final GroceryListRepository groceryListRepository;
    private final GroceryItemRepository groceryItemRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GroceryList>>> getLists(
            @AuthenticationPrincipal User currentUser) {
        List<GroceryList> lists = groceryListRepository
                .findByHouseholdIdOrderByCreatedAtDesc(currentUser.getHousehold().getId());
        return ResponseEntity.ok(ApiResponse.success(lists));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GroceryList>> createList(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "Shopping List");
        GroceryList list = GroceryList.builder()
                .name(name)
                .household(currentUser.getHousehold())
                .createdBy(currentUser)
                .build();
        GroceryList saved = groceryListRepository.save(list);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(saved));
    }

    @PostMapping("/{listId}/items")
    public ResponseEntity<ApiResponse<GroceryItem>> addItem(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long listId,
            @RequestBody GroceryItemRequest req) {
        GroceryList list = groceryListRepository.findById(listId)
                .orElseThrow(() -> new RuntimeException("List not found"));
        GroceryItem item = GroceryItem.builder()
                .groceryList(list)
                .name(req.getName())
                .quantity(req.getQuantity())
                .unit(req.getUnit())
                .estimatedPrice(req.getEstimatedPrice())
                .category(req.getCategory())
                .build();
        GroceryItem saved = groceryItemRepository.save(item);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(saved));
    }

    @PatchMapping("/items/{itemId}/check")
    public ResponseEntity<ApiResponse<GroceryItem>> toggleCheck(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long itemId) {
        GroceryItem item = groceryItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        item.setIsChecked(!item.getIsChecked());
        GroceryItem saved = groceryItemRepository.save(item);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    @PatchMapping("/{listId}/complete")
    public ResponseEntity<ApiResponse<GroceryList>> completeList(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long listId) {
        GroceryList list = groceryListRepository.findById(listId)
                .orElseThrow(() -> new RuntimeException("List not found"));
        list.setIsCompleted(true);
        GroceryList saved = groceryListRepository.save(list);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    @DeleteMapping("/{listId}")
    public ResponseEntity<ApiResponse<Void>> deleteList(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long listId) {
        groceryListRepository.deleteById(listId);
        return ResponseEntity.ok(ApiResponse.success(null, "Deleted"));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long itemId) {
        groceryItemRepository.deleteById(itemId);
        return ResponseEntity.ok(ApiResponse.success(null, "Deleted"));
    }
}
