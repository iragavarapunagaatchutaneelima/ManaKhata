package com.manaKhata.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    List<User> findByHouseholdId(Long householdId);
    Optional<User> findByHouseholdIdAndIsHouseheadTrue(Long householdId);
}
