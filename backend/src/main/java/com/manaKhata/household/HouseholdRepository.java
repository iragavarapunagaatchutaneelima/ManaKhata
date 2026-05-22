package com.manaKhata.household;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HouseholdRepository extends JpaRepository<Household, Long> {
    Optional<Household> findByInviteCode(String inviteCode);
    Boolean existsByInviteCode(String inviteCode);
}
